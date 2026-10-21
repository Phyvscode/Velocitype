import { Response } from 'express';
import mongoose from 'mongoose';
import SavedWord from '../models/SavedWord.js';
import { AuthRequest } from '../middleware/auth.js';

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripHtml = (s: string): string => s.replace(/[<>]/g, '').trim();

// @desc    Get user's saved words (supports optional ?q= search)
// @route   GET /api/words/saved
// @access  Private
export const getSavedWords = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const filter: Record<string, any> = { user: req.user._id };
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q && q.length <= 100) {
      filter.word = { $regex: new RegExp(escapeRegex(q), 'i') };
    }

    const words = await SavedWord.find(filter).sort({ createdAt: -1 }).limit(500);
    const formatted = words.map((w) => ({
      id: w._id,
      word: w.word,
      meaning: w.meaning,
      created_at: w.createdAt,
    }));
    return res.json(formatted);
  } catch (error: any) {
    console.error('Get Saved Words Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save a word with meaning
// @route   POST /api/words/saved
// @access  Private
export const saveWord = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { word, meaning } = req.body;
    if (!word || !meaning || typeof word !== 'string' || typeof meaning !== 'string') {
      return res.status(400).json({ message: 'Word and meaning are required as strings' });
    }

    const cleanWord = stripHtml(word).toLowerCase();
    const cleanMeaning = stripHtml(meaning);
    if (!cleanWord || !cleanMeaning) {
      return res.status(400).json({ message: 'Word and meaning cannot be blank' });
    }
    if (cleanWord.length > 100) {
      return res.status(400).json({ message: 'Word cannot exceed 100 characters' });
    }
    if (cleanMeaning.length > 2000) {
      return res.status(400).json({ message: 'Meaning cannot exceed 2000 characters' });
    }

    // Check if already saved by user
    const existing = await SavedWord.findOne({ user: req.user._id, word: cleanWord });
    if (existing) {
      existing.meaning = cleanMeaning;
      await existing.save();
      return res.json({
        id: existing._id,
        word: existing.word,
        meaning: existing.meaning,
        created_at: existing.createdAt,
      });
    }

    const newWord = await SavedWord.create({
      user: req.user._id,
      word: cleanWord,
      meaning: cleanMeaning,
    });

    return res.status(201).json({
      id: newWord._id,
      word: newWord.word,
      meaning: newWord.meaning,
      created_at: newWord.createdAt,
    });
  } catch (error: any) {
    console.error('Save Word Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a saved word's meaning
// @route   PUT /api/words/saved/:id
// @access  Private
export const updateSavedWord = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid word ID' });
    }

    const { meaning } = req.body;
    if (!meaning || typeof meaning !== 'string') {
      return res.status(400).json({ message: 'Meaning is required as a string' });
    }
    const cleanMeaning = stripHtml(meaning);
    if (!cleanMeaning || cleanMeaning.length > 2000) {
      return res.status(400).json({ message: 'Meaning must be between 1 and 2000 characters' });
    }

    const wordDoc = await SavedWord.findOne({ _id: id, user: req.user._id });
    if (!wordDoc) {
      return res.status(404).json({ message: 'Saved word not found' });
    }

    wordDoc.meaning = cleanMeaning;
    await wordDoc.save();

    return res.json({
      id: wordDoc._id,
      word: wordDoc.word,
      meaning: wordDoc.meaning,
      created_at: wordDoc.createdAt,
    });
  } catch (error: any) {
    console.error('Update Saved Word Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a saved word
// @route   DELETE /api/words/saved/:id
// @access  Private
export const deleteSavedWord = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid word ID' });
    }

    const word = await SavedWord.findOne({ _id: id, user: req.user._id });
    if (!word) {
      return res.status(404).json({ message: 'Saved word not found' });
    }

    await SavedWord.deleteOne({ _id: id, user: req.user._id });
    return res.json({ message: 'Word removed from library' });
  } catch (error: any) {
    console.error('Delete Saved Word Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
