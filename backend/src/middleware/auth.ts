import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User.js';
import { getJwtSecret } from '../config/security.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id?: string; purpose?: string };

    // Prevent single-purpose tokens (e.g. password-reset tokens) from being used as access tokens
    if (!decoded.id || decoded.purpose || !mongoose.isValidObjectId(decoded.id)) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found or token invalid' });
    }
    req.user = user;
    return next();
  } catch (error: any) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
