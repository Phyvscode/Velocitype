import mongoose, { Schema } from 'mongoose';
const savedWordSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    word: {
        type: String,
        required: true,
        trim: true,
    },
    meaning: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    timestamps: true,
});
export default mongoose.model('SavedWord', savedWordSchema);
