import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define environment variable schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3000'),
  API_VERSION: z.string().default('v1'),
  API_PUBLIC_PREFIX: z.string().default('public'),
  API_PRIVATE_PREFIX: z.string().default('private'),

  // Database configuration
  MONGODB_URI: z.string().url(),

  // JWT configuration
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRATION: z.string().default('900'),
  JWT_REFRESH_EXPIRATION: z.string().default('2592000'),
  JWT_RESET_PASSWORD_EXPIRATION: z.string().default('600'),

  // CORS configuration
  CORS_ORIGIN: z.string().default('*'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('100'),

  // Email configuration
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string().email(),

  // Logging configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // File upload configuration
  UPLOAD_LIMIT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('5242880'), // 5MB

  // Cookie configuration
  COOKIE_SECRET: z.string().min(32),

  // Client URL for email verification and password reset
  CLIENT_URL: z.string().url(),
});

// Create a type from the schema
type EnvConfig = z.infer<typeof envSchema>;

// Validate environment variables
const validateEnv = (): EnvConfig => {
  try {
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      API_VERSION: process.env.API_VERSION,
      API_PUBLIC_PREFIX: process.env.API_PUBLIC_PREFIX,
      API_PRIVATE_PREFIX: process.env.API_PRIVATE_PREFIX,
      MONGODB_URI: process.env.MONGODB_URI,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION,
      JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION,
      JWT_RESET_PASSWORD_EXPIRATION: process.env.JWT_RESET_PASSWORD_EXPIRATION,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      EMAIL_FROM: process.env.EMAIL_FROM,
      LOG_LEVEL: process.env.LOG_LEVEL,
      UPLOAD_LIMIT: process.env.UPLOAD_LIMIT,
      COOKIE_SECRET: process.env.COOKIE_SECRET,
      CLIENT_URL: process.env.CLIENT_URL,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
};

export default validateEnv;
