import mongoose, { Schema } from 'mongoose';
const testResultSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    wpm: {
        type: Number,
        required: true,
    },
    accuracy: {
        type: Number,
        required: true,
    },
    correctCount: {
        type: Number,
        required: true,
    },
    totalWords: {
        type: Number,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    rows: [
        {
            type: String,
        },
    ],
}, {
    timestamps: true,
});
export default mongoose.model('TestResult', testResultSchema);
