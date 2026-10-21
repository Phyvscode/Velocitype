import express from 'express';
import { generateSentencesProxy } from '../controllers/sentenceController.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const ONE_MIN = 60 * 1000;
const sentenceLimiter = rateLimit(20, ONE_MIN, 'sentences-generate');

router.post('/generate', sentenceLimiter, generateSentencesProxy);

export default router;
