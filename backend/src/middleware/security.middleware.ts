import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import validateEnv from '../config/env';
import { ApiResponseBuilder } from '../utils/apiResponse';

const env = validateEnv();

// Helmet configuration with CSP
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// CORS configuration
export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 600, // 10 minutes
});

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
};

// Prevent common attack patterns
export const preventAttacks = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  // Prevent HTTP Parameter Pollution
  const params = req.query;
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      req.query[key] = value[0];
    }
  }

  // Prevent large payloads
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > env.UPLOAD_LIMIT) {
    return ApiResponseBuilder.error(res, 'Payload too large', 413, {
      payload: `Maximum payload size is ${env.UPLOAD_LIMIT} bytes`,
    });
  }

  next();
};

// Force HTTPS in production
export const forceHttps = (req: Request, res: Response, next: NextFunction): Response | void => {
  if (env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return ApiResponseBuilder.fail(res, 'HTTPS is required', 301, {
      redirect: `https://${req.get('host')}${req.url}`,
    });
  }
  next();
};
