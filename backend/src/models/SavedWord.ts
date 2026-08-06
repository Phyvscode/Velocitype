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
    },
    meaning: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISavedWord>('SavedWord', savedWordSchema);
