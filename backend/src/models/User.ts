import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  authProvider?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  fontFamily?: string;
  colorTheme?: any;
  elo: number;
  avatarUrl?: string;
  profilePictureSource?: 'google' | 'upload';
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [function(this: any) { return this.authProvider !== 'google'; }, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    authProvider: {
      type: String,
      default: 'local',
      enum: ['local', 'google'],
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    fontFamily: {
      type: String,
      default: 'Inter',
    },
    colorTheme: {
      type: Schema.Types.Mixed,
      default: { name: 'Amber Glow', value: '#fbbf24', isGradient: false },
    },
    elo: {
      type: Number,
      default: 10,
    },
    avatarUrl: {
      type: String,
    },
    profilePictureSource: {
      type: String,
      enum: ['google', 'upload'],
    }
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
