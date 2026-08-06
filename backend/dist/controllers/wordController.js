import SavedWord from '../models/SavedWord.js';
// @desc    Get user's saved words
// @route   GET /api/words/saved
// @access  Private
export const getSavedWords = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const words = await SavedWord.find({ user: req.user._id }).sort({ createdAt: -1 });
        const formatted = words.map((w) => ({
            id: w._id,
            word: w.word,
            meaning: w.meaning,
            created_at: w.createdAt,
        }));
        return res.json(formatted);
    }
    catch (error) {
        console.error('Get Saved Words Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
// @desc    Save a word with meaning
// @route   POST /api/words/saved
// @access  Private
export const saveWord = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const { word, meaning } = req.body;
        if (!word || !meaning) {
            return res.status(400).json({ message: 'Word and meaning are required' });
        }
        // Check if already saved by user
        const existing = await SavedWord.findOne({ user: req.user._id, word: word.toLowerCase() });
        if (existing) {
            existing.meaning = meaning;
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
            word: word.toLowerCase(),
            meaning,
        });
        return res.status(201).json({
            id: newWord._id,
            word: newWord.word,
            meaning: newWord.meaning,
            created_at: newWord.createdAt,
        });
    }
    catch (error) {
        console.error('Save Word Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
// @desc    Delete a saved word
// @route   DELETE /api/words/saved/:id
// @access  Private
export const deleteSavedWord = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const { id } = req.params;
        const word = await SavedWord.findOne({ _id: id, user: req.user._id });
        if (!word) {
            return res.status(404).json({ message: 'Saved word not found' });
        }
        await SavedWord.deleteOne({ _id: id });
        return res.json({ message: 'Word removed from library' });
    }
    catch (error) {
        console.error('Delete Saved Word Error:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};
