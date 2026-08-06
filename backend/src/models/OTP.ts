import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  attempts: number;
  expiresAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IOTP>('OTP', otpSchema);
