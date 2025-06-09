import cookieParser from 'cookie-parser';
import express, { Express, NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import validateEnv from './config/env';
import { connectDB } from './database/connection';
import { AppError, errorHandler, globalErrorHandler } from './middleware/errorHandler';
import {
  corsMiddleware,
  forceHttps,
  helmetMiddleware,
  preventAttacks,
  securityHeaders,
} from './middleware/security.middleware';
import { ApiResponseBuilder } from './utils/apiResponse';
import logger, { stream } from './utils/logger';

// Import routes
import authRouter from './modules/auth/routes/auth.routes';

// Initialize environment variables
const env = validateEnv();

// Create Express app
const app: Express = express();

// Connect to MongoDB
connectDB().catch((err) => {
  logger.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Early error handling for JSON parsing
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return ApiResponseBuilder.fail(res, 'Invalid JSON format', 400, {
      body: 'The request body contains invalid JSON',
    });
  }
  next(err);
});

// Security middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(forceHttps);
app.use(preventAttacks);

// Request parsing middleware
app.use(
  express.json({
    limit: env.UPLOAD_LIMIT,
    verify: (_req: Request, _res: Response, buf: Buffer) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new AppError('Invalid JSON format', 400, {
          body: 'The request body contains invalid JSON',
        });
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: env.UPLOAD_LIMIT }));
app.use(cookieParser(env.COOKIE_SECRET));

// Logging middleware
app.use(
  morgan('combined', {
    stream,
    skip: (req) => req.url === '/health',
  }),
);

// Rate limiting
// app.use(defaultLimiter);

// API Documentation setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eKYB API Documentation',
      version: '1.0.0',
      description: 'API documentation for eKYB system',
      contact: {
        name: 'API Support',
        email: env.EMAIL_FROM,
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/routes/*.ts', './src/modules/**/models/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Routes
const apiVersion = `/api/${env.API_VERSION}`;

// API Documentation route
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  }),
);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  ApiResponseBuilder.success(
    res,
    {
      uptime: process.uptime(),
      timestamp: Date.now(),
      environment: env.NODE_ENV,
    },
    'Server is healthy',
  );
});

// Load routes

// Mount auth routes
app.use(`${apiVersion}/`, authRouter);

// Handle 404
app.use((_req: Request, res: Response) => {
  ApiResponseBuilder.fail(res, 'Route not found', 404);
});

// Error handling
app.use(globalErrorHandler);
app.use(errorHandler);

export default app;
