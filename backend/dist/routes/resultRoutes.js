import express from 'express';
import { saveResult, getHistory, getLeaderboard } from '../controllers/resultController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();
router.get('/leaderboard', getLeaderboard);
router.post('/', protect, saveResult);
router.get('/history', protect, getHistory);
export default router;
