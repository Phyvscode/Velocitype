import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';
import TestResult from '../models/TestResult.js';
import SavedWord from '../models/SavedWord.js';
import OTP from '../models/OTP.js';
import { AuthRequest } from '../middleware/auth.js';
import { getJwtSecret } from '../config/security.js';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id: string): string => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: '30d' });
};

// Only accept real strings from the request body. Objects such as {"$ne": null}
// would otherwise be passed straight into Mongo queries (NoSQL injection).
const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const normalizeEmail = (value: unknown): string | undefined => {
  const s = asString(value);
  return s ? s.trim().toLowerCase() : undefined;
};

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9_.-]{3,20}$/;
const PORTAL_BORDER_REGEX = /^b(0|1|3|4|5|7|9|11|12|13|14|15|16)$/;
const SAFE_DATA_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
const VALID_CHARACTERS = new Set(['mushgirl', 'screwed', 'joker', 'gravity', 'moneyguy']);

const isValidAvatarUrl = (url: string): boolean => {
  if (url === '') return true;
  if (url.length > 5_000_000) return false;
  if (SAFE_DATA_IMAGE_REGEX.test(url)) return true;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && url.length <= 2048;
  } catch {
    return false;
  }
};

const serializeUser = (user: IUser) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role || 'user',
  createdAt: user.createdAt,
  fontFamily: user.fontFamily,
  colorTheme: user.colorTheme,
  elo: user.elo,
  avatarUrl: user.avatarUrl,
  portalBorder: user.portalBorder,
  bgTheme: user.bgTheme,
  fullTheme: user.fullTheme,
  language: user.language,
  selectedCharacters: user.selectedCharacters,
  layoutConfig: user.layoutConfig,
  setupPrefs: user.setupPrefs,
});

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const username = asString(req.body.username)?.trim();
    const email = normalizeEmail(req.body.email);
    const password = asString(req.body.password);
    const avatarUrl = asString(req.body.avatarUrl);

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ message: 'Username must be 3-20 characters (letters, numbers, _ . -)' });
    }
    if (email.length > 254 || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 6 and 128 characters' });
    }
    if (avatarUrl !== undefined && !isValidAvatarUrl(avatarUrl)) {
      return res.status(400).json({ message: 'Invalid avatar image format or URL' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      if (userExists.googleId && !userExists.password) {
        return res.status(400).json({ message: 'An account with this email already exists. Please continue with Google to sign in.' });
      }
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Case-insensitive username check
    const usernameExists = await User.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') },
    });

    if (usernameExists) {
      return res.status(400).json({ message: 'This username is already taken. Please choose another one.' });
    }

    // Explicitly create only safe fields — never trust role, elo, or permissions from client
    const user = await User.create({
      username,
      email,
      password,
      role: 'user',
      elo: 10,
      avatarUrl: avatarUrl || undefined,
      profilePictureSource: avatarUrl ? 'upload' : undefined,
    });

    if (user) {
      const token = generateToken(user._id.toString());
      return res.status(201).json({
        token,
        user: serializeUser(user),
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Register Error:', error);
    if (error?.name === 'ValidationError') {
      const first = Object.values(error.errors || {})[0] as any;
      return res.status(400).json({ message: first?.message || 'Invalid user data' });
    }
    if (error?.code === 11000) {
      return res.status(400).json({ message: 'An account with this email or username already exists' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = asString(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    if (password.length > 128) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id.toString());
      return res.json({
        token,
        user: serializeUser(user),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req: Request, res: Response): Promise<Response> => {
  try {
    const credential = asString(req.body.credential);
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const email = payload.email.toLowerCase().trim();
    const googleId = payload.sub;
    const name = payload.name;
    const picture = payload.picture;

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (!user.avatarUrl || user.profilePictureSource !== 'upload') {
          if (picture) {
            user.avatarUrl = picture;
            user.profilePictureSource = 'google';
          }
        }
        await user.save();
      } else if (!user.avatarUrl && picture) {
        user.avatarUrl = picture;
        user.profilePictureSource = 'google';
        await user.save();
      }
    } else {
      const rawName = (name || email.split('@')[0]).replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 16);
      const desiredUsername = rawName.length >= 3 ? rawName : `typer_${crypto.randomInt(1000, 9999)}`;
      let isUnique = false;
      let counter = 0;
      let finalUsername = desiredUsername;

      while (!isUnique) {
        const existing = await User.findOne({
          username: { $regex: new RegExp(`^${escapeRegex(finalUsername)}$`, 'i') },
        });
        if (!existing) {
          isUnique = true;
        } else {
          counter++;
          finalUsername = `${desiredUsername}${counter}`;
        }
      }

      user = await User.create({
        username: finalUsername,
        email,
        googleId,
        authProvider: 'google',
        role: 'user',
        elo: 10,
        avatarUrl: picture,
        profilePictureSource: picture ? 'google' : undefined,
      });
    }

    const token = generateToken(user._id.toString());
    return res.json({
      token,
      user: serializeUser(user),
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    return res.status(401).json({ message: 'Google authentication failed' });
  }
};

// @desc    Get current user profile & stats summary
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const [testCount, savedWordsCount, bestResult, aggStats] = await Promise.all([
      TestResult.countDocuments({ user: user._id }),
      SavedWord.countDocuments({ user: user._id }),
      TestResult.findOne({ user: user._id }).sort({ wpm: -1 }),
      TestResult.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            avgWpm: { $avg: '$wpm' },
            avgAccuracy: { $avg: '$accuracy' },
            totalDuration: { $sum: '$duration' },
          },
        },
      ]),
    ]);

    const summary = aggStats[0] || { avgWpm: 0, avgAccuracy: 0, totalDuration: 0 };

    return res.json({
      user: serializeUser(user),
      stats: {
        testCount,
        savedWordsCount,
        bestWpm: bestResult ? bestResult.wpm : 0,
        avgWpm: Math.round(summary.avgWpm || 0),
        avgAccuracy: Math.round((summary.avgAccuracy || 0) * 10) / 10,
        totalDuration: Math.round(summary.totalDuration || 0),
        elo: user.elo,
      },
    });
  } catch (error: any) {
    console.error('GetMe Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    await OTP.deleteMany({ email });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTP.create({
      email,
      otp: otpCode,
      expiresAt,
    });

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"Velocitype" <noreply@velocitype.com>',
      to: email,
      subject: 'Velocitype Password Reset',
      text: `Your password reset code is: ${otpCode}. It will expire in 5 minutes.`,
      html: `<b>Your password reset code is: ${otpCode}</b><br/>It will expire in 5 minutes.`,
    });

    console.log('OTP sent: %s', info.messageId);
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return res.json({ message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('ForgotPassword Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = asString(req.body.otp)?.trim();
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit code' });
    }

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ message: 'No active OTP found. Please request a new one.' });
    }

    if (new Date() > record.expiresAt) {
      await OTP.deleteOne({ email });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        await OTP.deleteOne({ email });
        return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
      }
      await record.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is valid. Issue a single-purpose reset token.
    await OTP.deleteOne({ email });
    const resetToken = jwt.sign(
      { email, purpose: 'password-reset' },
      getJwtSecret(),
      { expiresIn: '15m' }
    );

    return res.json({ resetToken });
  } catch (error: any) {
    console.error('VerifyOTP Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const resetToken = asString(req.body.resetToken);
    const newPassword = asString(req.body.newPassword);
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6 || newPassword.length > 128) {
      return res.status(400).json({ message: 'Password must be between 6 and 128 characters' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, getJwtSecret());
    } catch {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (!decoded || decoded.purpose !== 'password-reset' || typeof decoded.email !== 'string') {
      return res.status(400).json({ message: 'Invalid reset token purpose' });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('ResetPassword Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user visual/game settings (never allows updating elo, role, or password)
// @route   PUT /api/auth/settings
// @access  Private
export const updateSettings = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Explicitly block attempts to tamper with protected fields via settings
    if (req.body.elo !== undefined || req.body.role !== undefined || req.body.score !== undefined) {
      return res.status(403).json({ message: 'Modifying elo, role, or score via settings is forbidden' });
    }

    const {
      fontFamily,
      colorTheme,
      avatarUrl,
      portalBorder,
      bgTheme,
      fullTheme,
      language,
      selectedCharacters,
      layoutConfig,
      setupPrefs,
    } = req.body;

    if (fontFamily !== undefined) {
      if (typeof fontFamily !== 'string' || fontFamily.trim().length === 0 || fontFamily.length > 100) {
        return res.status(400).json({ message: 'Invalid fontFamily value' });
      }
      user.fontFamily = fontFamily.trim();
    }

    if (portalBorder !== undefined) {
      if (typeof portalBorder !== 'string' || !PORTAL_BORDER_REGEX.test(portalBorder)) {
        return res.status(400).json({ message: 'Invalid portalBorder identifier' });
      }
      user.portalBorder = portalBorder;
    }

    if (colorTheme !== undefined) {
      if (
        colorTheme !== null &&
        typeof colorTheme !== 'string' &&
        typeof colorTheme !== 'object'
      ) {
        return res.status(400).json({ message: 'Invalid colorTheme format' });
      }
      if (typeof colorTheme === 'string' && colorTheme.length > 100) {
        return res.status(400).json({ message: 'colorTheme name too long' });
      }
      user.colorTheme = colorTheme;
    }

    if (bgTheme !== undefined) {
      if (bgTheme !== null && typeof bgTheme !== 'string' && typeof bgTheme !== 'object') {
        return res.status(400).json({ message: 'Invalid bgTheme format' });
      }
      user.bgTheme = bgTheme;
    }

    if (fullTheme !== undefined) {
      if (fullTheme !== null && (typeof fullTheme !== 'string' || fullTheme.length > 100)) {
        return res.status(400).json({ message: 'Invalid fullTheme format' });
      }
      user.fullTheme = fullTheme;
    }

    if (language !== undefined) {
      if (typeof language !== 'string' || language.trim().length === 0 || language.length > 40) {
        return res.status(400).json({ message: 'Invalid language identifier' });
      }
      user.language = language.trim().toLowerCase();
    }

    if (selectedCharacters !== undefined) {
      if (
        !Array.isArray(selectedCharacters) ||
        selectedCharacters.length < 1 ||
        selectedCharacters.length > 3 ||
        !selectedCharacters.every((c) => typeof c === 'string' && VALID_CHARACTERS.has(c))
      ) {
        return res.status(400).json({ message: 'selectedCharacters must be 1 to 3 valid character IDs' });
      }
      user.selectedCharacters = Array.from(new Set(selectedCharacters));
    }

    if (layoutConfig !== undefined) {
      if (layoutConfig !== null && (typeof layoutConfig !== 'object' || Array.isArray(layoutConfig))) {
        return res.status(400).json({ message: 'Invalid layoutConfig object' });
      }
      user.layoutConfig = layoutConfig;
    }

    if (setupPrefs !== undefined) {
      if (setupPrefs !== null && (typeof setupPrefs !== 'object' || Array.isArray(setupPrefs))) {
        return res.status(400).json({ message: 'Invalid setupPrefs object' });
      }
      user.setupPrefs = setupPrefs;
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl !== null && (typeof avatarUrl !== 'string' || !isValidAvatarUrl(avatarUrl))) {
        return res.status(400).json({ message: 'Invalid avatar image format or URL' });
      }
      user.avatarUrl = avatarUrl || undefined;
      if (avatarUrl) {
        user.profilePictureSource = 'upload';
      }
    }

    await user.save();

    return res.json({
      message: 'Settings updated',
      user: serializeUser(user),
    });
  } catch (error: any) {
    console.error('UpdateSettings Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile (username / avatar)
// @route   PATCH /api/auth/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.body.elo !== undefined || req.body.role !== undefined) {
      return res.status(403).json({ message: 'Modifying elo or role is forbidden' });
    }

    const username = asString(req.body.username)?.trim();
    const avatarUrl = req.body.avatarUrl;

    if (username !== undefined) {
      if (!USERNAME_REGEX.test(username)) {
        return res.status(400).json({ message: 'Username must be 3-20 characters (letters, numbers, _ . -)' });
      }
      const existing = await User.findOne({
        _id: { $ne: user._id },
        username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') },
      });
      if (existing) {
        return res.status(400).json({ message: 'This username is already taken' });
      }
      user.username = username;
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl !== null && (typeof avatarUrl !== 'string' || !isValidAvatarUrl(avatarUrl))) {
        return res.status(400).json({ message: 'Invalid avatar image format or URL' });
      }
      user.avatarUrl = avatarUrl || undefined;
      if (avatarUrl) {
        user.profilePictureSource = 'upload';
      }
    }

    await user.save();

    return res.json({
      message: 'Profile updated',
      user: serializeUser(user),
    });
  } catch (error: any) {
    console.error('UpdateProfile Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
