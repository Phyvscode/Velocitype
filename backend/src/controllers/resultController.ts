import { Request, Response } from 'express';
import mongoose from 'mongoose';
import TestResult from '../models/TestResult.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

const MAX_PLAUSIBLE_WPM = 350;
const VALID_MODES = new Set(['words', 'file', 'random-sentences', 'multiplayer', 'ranked']);
const VALID_ROWS = new Set(['top', 'home', 'bottom']);

// @desc    Save typing test result (with server-side verification & anti-cheat validation)
// @route   POST /api/results
// @access  Private
export const saveResult = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const {
      wpm,
      rawWpm,
      accuracy,
      consistency,
      correctCount,
      totalWords,
      correctChars,
      duration,
      mode,
      rows,
      cia,
      typed,
    } = req.body;

    const numDuration = Number(duration);
    if (!Number.isFinite(numDuration) || numDuration < 1 || numDuration > 3600) {
      return res.status(400).json({ message: 'Duration must be between 1 and 3600 seconds' });
    }

    let finalTotalWords = Number(totalWords ?? 0);
    let finalCorrectCount = Number(correctCount ?? 0);
    let computedWpm: number;
    let computedAccuracy: number;

    // If the client provides the typed words array or correctChars, compute WPM and accuracy authoritatively on the server
    if (Array.isArray(typed) && typed.length > 0 && typed.length <= 5000) {
      finalTotalWords = typed.length;
      const validCorrectWords = typed.filter(
        (t: any) => t && typeof t.word === 'string' && t.word.length <= 60 && Boolean(t.correct)
      );
      finalCorrectCount = validCorrectWords.length;
      const chars = validCorrectWords.reduce((sum: number, t: any) => sum + t.word.trim().length, 0);
      const minutes = numDuration / 60;
      computedWpm = Math.round(chars / 5 / minutes);
      computedAccuracy = Math.round((finalCorrectCount / finalTotalWords) * 100);
    } else if (correctChars !== undefined && Number.isFinite(Number(correctChars))) {
      const chars = Math.max(0, Number(correctChars));
      if (!Number.isFinite(finalTotalWords) || finalTotalWords < 0 || finalTotalWords > 5000) {
        return res.status(400).json({ message: 'Invalid totalWords count' });
      }
      if (!Number.isFinite(finalCorrectCount) || finalCorrectCount < 0 || finalCorrectCount > finalTotalWords) {
        return res.status(400).json({ message: 'correctCount cannot exceed totalWords' });
      }
      if (finalCorrectCount === 0 && chars > 0) {
        return res.status(400).json({ message: 'Inconsistent correctChars and correctCount' });
      }
      // Average word length cannot plausibly exceed 25 chars per correct word
      if (finalCorrectCount > 0 && chars / finalCorrectCount > 25) {
        return res.status(400).json({ message: 'Manipulated character count detected' });
      }
      const minutes = numDuration / 60;
      computedWpm = Math.round(chars / 5 / minutes);
      computedAccuracy = finalTotalWords > 0 ? Math.round((finalCorrectCount / finalTotalWords) * 100) : 0;
    } else {
      const numWpm = Number(wpm);
      const numAccuracy = Number(accuracy);

      if (
        wpm === undefined ||
        accuracy === undefined ||
        !Number.isFinite(numWpm) ||
        !Number.isFinite(numAccuracy) ||
        numWpm < 0 ||
        numAccuracy < 0 ||
        numAccuracy > 100
      ) {
        return res.status(400).json({ message: 'Valid wpm (0-350) and accuracy (0-100) numbers are required' });
      }

      if (!Number.isFinite(finalTotalWords) || finalTotalWords < 0 || finalTotalWords > 5000) {
        return res.status(400).json({ message: 'Invalid totalWords count' });
      }
      if (!Number.isFinite(finalCorrectCount) || finalCorrectCount < 0 || finalCorrectCount > finalTotalWords) {
        return res.status(400).json({ message: 'correctCount cannot exceed totalWords' });
      }

      // Cross-check WPM & accuracy consistency against word counts
      if (finalTotalWords > 0) {
        const expectedAcc = Math.round((finalCorrectCount / finalTotalWords) * 100);
        if (Math.abs(numAccuracy - expectedAcc) > 2) {
          return res.status(400).json({ message: 'Submitted accuracy does not match correctCount / totalWords' });
        }
      }
      if (finalCorrectCount === 0 && numWpm > 0) {
        return res.status(400).json({ message: 'Cannot record positive WPM with 0 correct words' });
      }
      if (finalCorrectCount > 0) {
        const impliedChars = numWpm * 5 * (numDuration / 60);
        if (impliedChars / finalCorrectCount > 25) {
          return res.status(400).json({ message: 'Submitted WPM is inconsistent with word count and duration' });
        }
      }

      computedWpm = Math.round(numWpm);
      computedAccuracy = Math.min(100, Math.round(numAccuracy * 100) / 100);
    }

    if (computedWpm < 0 || computedWpm > MAX_PLAUSIBLE_WPM) {
      return res.status(400).json({
        message: `WPM (${computedWpm}) exceeds maximum plausible human limit (${MAX_PLAUSIBLE_WPM})`,
      });
    }

    const cleanRows = Array.isArray(rows)
      ? rows.filter((r): r is string => typeof r === 'string' && VALID_ROWS.has(r))
      : [];

    const cleanMode = typeof mode === 'string' && VALID_MODES.has(mode) ? mode : 'words';

    const cleanCia =
      cia && typeof cia === 'object'
        ? {
            c: Math.max(0, Math.round(Number(cia.c) || 0)),
            i: Math.max(0, Math.round(Number(cia.i) || 0)),
            a: Math.max(0, Math.round(Number(cia.a) || 0)),
          }
        : undefined;

    const result = await TestResult.create({
      user: req.user._id,
      wpm: computedWpm,
      rawWpm:
        rawWpm !== undefined && Number.isFinite(Number(rawWpm))
          ? Math.min(450, Math.max(0, Math.round(Number(rawWpm))))
          : undefined,
      accuracy: computedAccuracy,
      consistency:
        consistency !== undefined && Number.isFinite(Number(consistency))
          ? Math.min(100, Math.max(0, Math.round(Number(consistency))))
          : undefined,
      correctCount: finalCorrectCount,
      totalWords: finalTotalWords,
      duration: Math.round(numDuration),
      mode: cleanMode,
      rows: cleanRows,
      cia: cleanCia,
    });

    return res.status(201).json({
      id: result._id,
      wpm: result.wpm,
      rawWpm: result.rawWpm,
      accuracy: result.accuracy,
      consistency: result.consistency,
      correctCount: result.correctCount,
      totalWords: result.totalWords,
      duration: result.duration,
      mode: result.mode,
      cia: result.cia,
      createdAt: result.createdAt,
    });
  } catch (error: any) {
    console.error('Save Result Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user test history
// @route   GET /api/results/history
// @access  Private
export const getHistory = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const skip = (page - 1) * limit;

    const results = await TestResult.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json(results);
  } catch (error: any) {
    console.error('Get History Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get detailed user typing statistics
// @route   GET /api/results/stats
// @access  Private
export const getUserStats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const [agg, recentResults] = await Promise.all([
      TestResult.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: null,
            testCount: { $sum: 1 },
            bestWpm: { $max: '$wpm' },
            avgWpm: { $avg: '$wpm' },
            avgAccuracy: { $avg: '$accuracy' },
            totalDuration: { $sum: '$duration' },
            totalWordsTyped: { $sum: '$totalWords' },
          },
        },
      ]),
      TestResult.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('wpm accuracy duration mode createdAt'),
    ]);

    const summary = agg[0] || {
      testCount: 0,
      bestWpm: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      totalDuration: 0,
      totalWordsTyped: 0,
    };

    return res.json({
      testCount: summary.testCount,
      bestWpm: summary.bestWpm || 0,
      avgWpm: Math.round(summary.avgWpm || 0),
      avgAccuracy: Math.round((summary.avgAccuracy || 0) * 10) / 10,
      totalDuration: summary.totalDuration || 0,
      totalWordsTyped: summary.totalWordsTyped || 0,
      elo: req.user.elo,
      recentResults,
    });
  } catch (error: any) {
    console.error('Get User Stats Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get global leaderboard (top WPM results or top ELO rankings)
// @route   GET /api/results/leaderboard
// @access  Public
export const getLeaderboard = async (req: Request, res: Response): Promise<Response> => {
  try {
    const type = String(req.query.type || 'wpm').toLowerCase();
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10) || 10));

    if (type === 'elo') {
      const topPlayers = await User.find()
        .select('username elo avatarUrl createdAt')
        .sort({ elo: -1, createdAt: 1 })
        .limit(limit);

      return res.json(
        topPlayers.map((u) => ({
          id: u._id,
          username: u.username,
          elo: u.elo,
          wpm: 0,
          accuracy: 100,
          duration: 60,
          createdAt: u.createdAt,
        }))
      );
    }

    // Deduplicate by user so each player's personal best WPM represents them on the global leaderboard
    const topResults = await TestResult.aggregate([
      { $match: { wpm: { $lte: MAX_PLAUSIBLE_WPM } } },
      { $sort: { wpm: -1, accuracy: -1, createdAt: 1 } },
      {
        $group: {
          _id: '$user',
          resultId: { $first: '$_id' },
          wpm: { $first: '$wpm' },
          accuracy: { $first: '$accuracy' },
          duration: { $first: '$duration' },
          createdAt: { $first: '$createdAt' },
        },
      },
      { $sort: { wpm: -1, accuracy: -1, createdAt: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDoc',
        },
      },
    ]);

    const leaderboard = topResults.map((r) => ({
      id: r.resultId,
      username: r.userDoc?.[0]?.username || 'Anonymous',
      elo: r.userDoc?.[0]?.elo ?? 10,
      wpm: r.wpm,
      accuracy: r.accuracy,
      duration: r.duration,
      createdAt: r.createdAt,
    }));

    return res.json(leaderboard);
  } catch (error: any) {
    console.error('Get Leaderboard Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a specific test result owned by the authenticated user
// @route   DELETE /api/results/:id
// @access  Private
export const deleteResult = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid result ID' });
    }

    const result = await TestResult.findOne({ _id: id, user: req.user._id });
    if (!result) {
      return res.status(404).json({ message: 'Test result not found' });
    }

    await TestResult.deleteOne({ _id: id, user: req.user._id });
    return res.json({ message: 'Test result deleted' });
  } catch (error: any) {
    console.error('Delete Result Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
