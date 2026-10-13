import { Request, Response } from 'express';
import TestResult from '../models/TestResult.js';
import { AuthRequest } from '../middleware/auth.js';

// @desc    Save typing test result
// @route   POST /api/results
// @access  Private
export const saveResult = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { wpm, accuracy, correctCount, totalWords, duration, rows } = req.body;

    const numWpm = Number(wpm);
    const numAccuracy = Number(accuracy);

    if (wpm === undefined || accuracy === undefined || isNaN(numWpm) || isNaN(numAccuracy) || numWpm < 0 || numAccuracy < 0) {
      return res.status(400).json({ message: 'Valid non-negative wpm and accuracy numbers are required' });
    }

    const result = await TestResult.create({
      user: req.user._id,
      wpm: Math.round(numWpm),
      accuracy: Math.min(100, Math.round(numAccuracy * 100) / 100),
      correctCount: Math.max(0, Number(correctCount) || 0),
      totalWords: Math.max(0, Number(totalWords) || 0),
      duration: Math.max(0, Number(duration) || 0),
      rows: Array.isArray(rows) ? rows.map(String) : [],
    });

    return res.status(201).json({
      id: result._id,
      wpm: result.wpm,
      accuracy: result.accuracy,
      correctCount: result.correctCount,
      totalWords: result.totalWords,
      duration: result.duration,
      createdAt: result.createdAt,
    });
  } catch (error: any) {
    console.error('Save Result Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
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

    const results = await TestResult.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json(results);
  } catch (error: any) {
    console.error('Get History Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get global leaderboard (top WPM results)
// @route   GET /api/results/leaderboard
// @access  Public
export const getLeaderboard = async (req: Request, res: Response): Promise<Response> => {
  try {
    const topResults = await TestResult.find()
      .populate<{ user: { username: string } }>('user', 'username')
      .sort({ wpm: -1, accuracy: -1 })
      .limit(10);

    const leaderboard = topResults.map((r) => ({
      id: r._id,
      username: r.user ? r.user.username : 'Anonymous',
      wpm: r.wpm,
      accuracy: r.accuracy,
      duration: r.duration,
      createdAt: r.createdAt,
    }));

    return res.json(leaderboard);
  } catch (error: any) {
    console.error('Get Leaderboard Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};
