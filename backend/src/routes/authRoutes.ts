import express from 'express';
import { registerUser, loginUser, getMe, forgotPassword, verifyOTP, resetPassword, updateSettings } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/settings', protect, updateSettings);

export default router;
