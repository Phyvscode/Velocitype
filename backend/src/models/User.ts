import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  authProvider?: string;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  fontFamily?: string;
  colorTheme?: any;
  elo: number;
  avatarUrl?: string;
  profilePictureSource?: 'google' | 'upload';
  portalBorder?: string;
  bgTheme?: any;
  fullTheme?: string | null;
  language?: string;
  selectedCharacters?: string[];
  layoutConfig?: any;
  setupPrefs?: any;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email is too long'],
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [function (this: any) { return this.authProvider !== 'google'; }, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
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
      maxlength: [100, 'Font family name too long'],
    },
    colorTheme: {
      type: Schema.Types.Mixed,
      default: { name: 'Amber Glow', value: '#fbbf24', isGradient: false },
    },
    elo: {
      type: Number,
      default: 10,
      min: 0,
    },
    avatarUrl: {
      type: String,
    },
    profilePictureSource: {
      type: String,
      enum: ['google', 'upload'],
    },
    bgTheme: {
      type: Schema.Types.Mixed,
      default: null,
    },
    portalBorder: {
      type: String,
      default: 'b16',
      maxlength: [20, 'Invalid portal border id'],
    },
    fullTheme: {
      type: String,
      default: null,
      maxlength: [100, 'Theme name too long'],
    },
    language: {
      type: String,
      default: 'english',
      maxlength: [40, 'Language identifier too long'],
    },
    selectedCharacters: {
      type: [String],
      default: ['mushgirl', 'screwed', 'joker'],
    },
    layoutConfig: {
      type: Schema.Types.Mixed,
      default: null,
    },
    setupPrefs: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
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
