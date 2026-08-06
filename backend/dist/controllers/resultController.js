import TestResult from '../models/TestResult.js';
// @desc    Save typing test result
// @route   POST /api/results
// @access  Private
export const saveResult = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const { wpm, accuracy, correctCount, totalWords, duration, rows } = req.body;
        if (wpm === undefined || accuracy === undefined) {
            return res.status(400).json({ message: 'wpm and accuracy are required' });
        }
        const result = await TestResult.create({
            user: req.user._id,
            wpm,
            accuracy,
            correctCount: correctCount || 0,
            totalWords: totalWords || 0,
            duration: duration || 0,
            rows: rows || [],
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
    }
    catch (error) {
        console.error('Save Result Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
// @desc    Get user test history
// @route   GET /api/results/history
// @access  Private
export const getHistory = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const results = await TestResult.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        return res.json(results);
    }
    catch (error) {
        console.error('Get History Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
// @desc    Get global leaderboard (top WPM results)
// @route   GET /api/results/leaderboard
// @access  Public
export const getLeaderboard = async (req, res) => {
    try {
        const topResults = await TestResult.find()
            .populate('user', 'username')
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
    }
    catch (error) {
        console.error('Get Leaderboard Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
