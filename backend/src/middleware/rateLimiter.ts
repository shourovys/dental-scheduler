import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ApiResponseBuilder } from '../utils/apiResponse';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

const createLimiter = (config: RateLimitConfig) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    handler: (req: Request, res: Response, _next: NextFunction) => {
      ApiResponseBuilder.error(res, 'Too many requests', 429, {
        error: config.message,
        retryAfter: String(Math.ceil(config.windowMs / 1000)),
        remainingTime: `${Math.ceil(config.windowMs / 60000)} minutes`,
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Default rate limiter for general API endpoints
export const defaultLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Strict rate limiter for authentication endpoints
export const authLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again after an hour',
});

// Rate limiter for password reset attempts
export const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per windowMs
  message: 'Too many password reset attempts, please try again after an hour',
});
