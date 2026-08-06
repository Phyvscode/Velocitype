import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TestResult from '../models/TestResult.js';
import SavedWord from '../models/SavedWord.js';
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'velocitype_secret_jwt_key_2026', { expiresIn: '30d' });
};
// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const user = await User.create({
            username,
            email,
            password,
        });
        if (user) {
            const token = generateToken(user._id.toString());
            return res.status(201).json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                },
            });
        }
        else {
            return res.status(400).json({ message: 'Invalid user data' });
        }
    }
    catch (error) {
        console.error('Register Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id.toString());
            return res.json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                },
            });
        }
        else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    }
    catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
// @desc    Get current user profile & stats summary
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const testCount = await TestResult.countDocuments({ user: user._id });
        const savedWordsCount = await SavedWord.countDocuments({ user: user._id });
        const bestResult = await TestResult.findOne({ user: user._id }).sort({ wpm: -1 });
        return res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
            },
            stats: {
                testCount,
                savedWordsCount,
                bestWpm: bestResult ? bestResult.wpm : 0,
            },
        });
    }
    catch (error) {
        console.error('GetMe Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
