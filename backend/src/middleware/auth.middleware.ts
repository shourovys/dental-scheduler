import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import validateEnv from '../config/env';
import User, { IUser } from '../modules/auth/models/user.model';
import logger from '../utils/logger';
import { AppError } from './errorHandler';

const env = validateEnv();

interface JwtPayload {
  userId: string;
  email: string;
}

// Extend Express Request type using module augmentation
declare module 'express' {
  interface Request {
    user?: IUser & { _id: Types.ObjectId };
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1) Get token from header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw new AppError('You are not logged in. Please log in to get access.', 401);
    }

    // 2) Verify token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Your session has expired. Please log in again.', 401, {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token. Please log in again.', 401, {
          code: 'INVALID_TOKEN',
          message: 'Token verification failed',
        });
      }
      throw error;
    }

    // 3) Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('The user belonging to this token no longer exists.', 401, {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    // 4) Check if user is verified
    if (!user.isVerified) {
      throw new AppError('Please verify your email to access this resource.', 403, {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required',
      });
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', {
      error,
      path: req.path,
      method: req.method,
      token: req.headers.authorization ? '***' : undefined,
    });
    next(error);
  }
};
