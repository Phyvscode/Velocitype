import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
  updateSettings,
  updateProfile,
  googleAuth,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const FIFTEEN_MIN = 15 * 60 * 1000;
const authLimiter = rateLimit(30, FIFTEEN_MIN, 'auth-login-signup');     // login / signup / google
const recoveryLimiter = rateLimit(10, FIFTEEN_MIN, 'auth-recovery');     // forgot-password / OTP / reset
const profileLimiter = rateLimit(60, FIFTEEN_MIN, 'auth-profile-write'); // profile / settings updates

router.post('/signup', authLimiter, registerUser);
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password', recoveryLimiter, forgotPassword);
router.post('/verify-otp', recoveryLimiter, verifyOTP);
router.post('/reset-password', recoveryLimiter, resetPassword);
router.get('/me', protect, getMe);
router.put('/settings', protect, profileLimiter, updateSettings);
router.patch('/settings', protect, profileLimiter, updateSettings);
router.patch('/profile', protect, profileLimiter, updateProfile);

export default router;
