import express from 'express';
import { getSavedWords, saveWord, deleteSavedWord } from '../controllers/wordController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.get('/saved', getSavedWords);
router.post('/saved', saveWord);
router.delete('/saved/:id', deleteSavedWord);
export default router;
