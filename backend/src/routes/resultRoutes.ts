import express from 'express';
import {
  saveResult,
  getHistory,
  getUserStats,
  getLeaderboard,
  deleteResult,
} from '../controllers/resultController.js';
import { protect } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const ONE_MIN = 60 * 1000;
const writeResultLimiter = rateLimit(30, ONE_MIN, 'results-write');
const readResultLimiter = rateLimit(120, ONE_MIN, 'results-read');

router.get('/leaderboard', readResultLimiter, getLeaderboard);
router.get('/history', protect, readResultLimiter, getHistory);
router.get('/stats', protect, readResultLimiter, getUserStats);
router.post('/', protect, writeResultLimiter, saveResult);
router.delete('/:id', protect, writeResultLimiter, deleteResult);

export default router;
