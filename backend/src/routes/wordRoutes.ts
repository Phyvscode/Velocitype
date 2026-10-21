import express from 'express';
import {
  getSavedWords,
  saveWord,
  updateSavedWord,
  deleteSavedWord,
} from '../controllers/wordController.js';
import { protect } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const ONE_MIN = 60 * 1000;
const wordsWriteLimiter = rateLimit(60, ONE_MIN, 'words-write');
const wordsReadLimiter = rateLimit(120, ONE_MIN, 'words-read');

router.use(protect);

router.get('/saved', wordsReadLimiter, getSavedWords);
router.post('/saved', wordsWriteLimiter, saveWord);
router.put('/saved/:id', wordsWriteLimiter, updateSavedWord);
router.delete('/saved/:id', wordsWriteLimiter, deleteSavedWord);

export default router;
