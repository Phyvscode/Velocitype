import mongoose, { Schema, Document } from 'mongoose';

export interface ITestResult extends Document {
  user: mongoose.Types.ObjectId;
  wpm: number;
  accuracy: number;
  correctCount: number;
  totalWords: number;
  duration: number;
  rows: string[];
  createdAt: Date;
  updatedAt: Date;
}

const testResultSchema = new Schema<ITestResult>(
  {
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITestResult>('TestResult', testResultSchema);
