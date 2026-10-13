import express from 'express';
import { registerUser, loginUser, getMe, forgotPassword, verifyOTP, resetPassword, updateSettings, googleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const FIFTEEN_MIN = 15 * 60 * 1000;
const authLimiter = rateLimit(30, FIFTEEN_MIN);     // login / signup / google
const recoveryLimiter = rateLimit(10, FIFTEEN_MIN); // forgot-password / OTP / reset

router.post('/signup', authLimiter, registerUser);
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password', recoveryLimiter, forgotPassword);
router.post('/verify-otp', recoveryLimiter, verifyOTP);
router.post('/reset-password', recoveryLimiter, resetPassword);
router.get('/me', protect, getMe);
router.put('/settings', protect, updateSettings);

export default router;
