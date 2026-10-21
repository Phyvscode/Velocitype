import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedWord extends Document {
  user: mongoose.Types.ObjectId;
  word: string;
  meaning: string;
  createdAt: Date;
  updatedAt: Date;
}

const savedWordSchema = new Schema<ISavedWord>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    word: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Word cannot exceed 100 characters'],
    },
    meaning: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Meaning cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

savedWordSchema.index({ user: 1, word: 1 }, { unique: true });

export default mongoose.model<ISavedWord>('SavedWord', savedWordSchema);
