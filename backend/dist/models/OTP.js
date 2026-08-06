import mongoose, { Schema } from 'mongoose';
const otpSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    otp: {
        type: String,
        required: true,
    },
    attempts: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '5m' }, // Automatically deletes the document 5 minutes after expiresAt
    },
}, {
    timestamps: true,
});
export default mongoose.model('OTP', otpSchema);
