import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TestResult from '../models/TestResult.js';
import SavedWord from '../models/SavedWord.js';
import OTP from '../models/OTP.js';
import { AuthRequest } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'velocitype_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { username, email, password, avatarUrl } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      if (userExists.googleId && !userExists.password) {
        return res.status(400).json({ message: 'An account with this email already exists. Please continue with Google to sign in.' });
      }
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      avatarUrl,
      profilePictureSource: avatarUrl ? 'upload' : undefined,
    });

    if (user) {
      const token = generateToken(user._id.toString());
      return res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fontFamily: user.fontFamily,
          colorTheme: user.colorTheme,
          elo: user.elo,
        },
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Register Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id.toString());
      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fontFamily: user.fontFamily,
          colorTheme: user.colorTheme,
          elo: user.elo,
          avatarUrl: user.avatarUrl,
        },
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { credential } = req.body;
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

    const { email, sub: googleId, name, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      // Link Google account if not linked
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
      // Create new user
      user = await User.create({
        username: name || email.split('@')[0],
        email,
        googleId,
        authProvider: 'google',
        avatarUrl: picture,
        profilePictureSource: picture ? 'google' : undefined,
      });
    }

    const token = generateToken(user._id.toString());
    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fontFamily: user.fontFamily,
        colorTheme: user.colorTheme,
        elo: user.elo,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ message: 'Google authentication failed' });
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

    const testCount = await TestResult.countDocuments({ user: user._id });
    const savedWordsCount = await SavedWord.countDocuments({ user: user._id });
    const bestResult = await TestResult.findOne({ user: user._id }).sort({ wpm: -1 });

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        fontFamily: user.fontFamily,
        colorTheme: user.colorTheme,
        elo: user.elo,
        avatarUrl: user.avatarUrl,
      },
      stats: {
        testCount,
        savedWordsCount,
        bestWpm: bestResult ? bestResult.wpm : 0,
      },
    });
  } catch (error: any) {
    console.error('GetMe Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
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
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove existing OTPs for this email
    await OTP.deleteMany({ email });

    // Save new OTP (expires in 5 minutes)
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
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
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

    // OTP is valid. Issue a temporary reset token.
    await OTP.deleteOne({ email });
    const resetToken = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'velocitype_secret_jwt_key_2026',
      { expiresIn: '15m' }
    );

    return res.json({ resetToken });
  } catch (error: any) {
    console.error('VerifyOTP Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'velocitype_secret_jwt_key_2026');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
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
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { fontFamily, colorTheme, avatarUrl } = req.body;
    if (fontFamily) user.fontFamily = fontFamily;
    if (colorTheme) user.colorTheme = colorTheme;
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl;
      if (avatarUrl) {
        user.profilePictureSource = 'upload';
      }
    }

    await user.save();

    return res.json({ message: 'Settings updated' });
  } catch (error: any) {
    console.error('UpdateSettings Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};
