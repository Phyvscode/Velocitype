import mongoose, { Schema, Document } from 'mongoose';

export interface ITestResult extends Document {
  user: mongoose.Types.ObjectId;
  wpm: number;
  rawWpm?: number;
  accuracy: number;
  consistency?: number;
  correctCount: number;
  totalWords: number;
  duration: number;
  mode?: string;
  rows: string[];
  cia?: { c: number; i: number; a: number };
  createdAt: Date;
  updatedAt: Date;
}

const testResultSchema = new Schema<ITestResult>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    wpm: {
      type: Number,
      required: true,
      min: 0,
      max: 350,
    },
    rawWpm: {
      type: Number,
      min: 0,
      max: 450,
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    consistency: {
      type: Number,
      min: 0,
      max: 100,
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalWords: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 3600,
    },
    mode: {
      type: String,
      default: 'words',
      enum: ['words', 'file', 'random-sentences', 'multiplayer', 'ranked'],
    },
    rows: [
      {
        type: String,
      },
    ],
    cia: {
      c: { type: Number, default: 0 },
      i: { type: Number, default: 0 },
      a: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

testResultSchema.index({ user: 1, createdAt: -1 });
testResultSchema.index({ wpm: -1, accuracy: -1 });

export default mongoose.model<ITestResult>('TestResult', testResultSchema);
