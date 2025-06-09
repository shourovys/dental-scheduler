import { NextFunction, Request, Response } from 'express';
import { ValidationError as ExpressValidationError, Result } from 'express-validator';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  errors?: Record<string, string>;

  constructor(message: string, statusCode: number, errors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  status: string;
  message: string;
  errors?: Record<string, string>;
  data: null;
  stack?: string;
}

const handleMongoError = (error: MongoError): AppError => {
  if (error.code === 11000) {
    const field = Object.keys((error as any).keyValue)[0];
    return new AppError(`Duplicate value for ${field}`, 409, {
      [field]: `This ${field} is already in use`,
    });
  }
  return new AppError('Database error', 500);
};

const handleValidationError = (errors: Result<ExpressValidationError>): AppError => {
  const errorMap: Record<string, string> = {};
  errors.array().forEach((err) => {
    if ('param' in err && 'msg' in err) {
      errorMap[err.param as string] = err.msg as string;
    }
  });
  return new AppError('Validation error', 400, errorMap);
};

const handleZodError = (error: ZodError): AppError => {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    errors[err.path.join('.')] = err.message;
  });
  return new AppError('Validation error', 400, errors);
};

const handleMongooseError = (error: MongooseError.ValidationError): AppError => {
  const errors: Record<string, string> = {};
  Object.values(error.errors).forEach((err) => {
    errors[err.path] = err.message;
  });
  return new AppError('Validation error', 400, errors);
};

export const errorHandler = (
  error: Error | Result<ExpressValidationError>,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Ensure response hasn't been sent yet
  if (res.headersSent) {
    return;
  }

  // Set JSON content type and prevent Express from sending HTML error pages
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  logger.error('Error:', {
    message: error instanceof Error ? error.message : 'Validation Error',
    stack: error instanceof Error ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  let statusCode = 500;
  let errorResponse: ErrorResponse = {
    status: 'error',
    message: 'Internal server error',
    data: null,
  };

  try {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof MongoError) {
      appError = handleMongoError(error);
    } else if ('array' in error && typeof error.array === 'function') {
      appError = handleValidationError(error);
    } else if (error instanceof ZodError) {
      appError = handleZodError(error);
    } else if (error instanceof MongooseError.ValidationError) {
      appError = handleMongooseError(error);
    } else {
      appError = new AppError(
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error instanceof Error
            ? error.message
            : 'Unknown error',
        500,
      );
    }

    statusCode = appError.statusCode;
    errorResponse = {
      status: appError.status,
      message: appError.message,
      errors: appError.errors,
      data: null,
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = appError.stack;
    }

    res.status(statusCode).json(errorResponse);
  } catch (e) {
    // If something goes wrong while handling the error, send a basic error response
    logger.error('Error in error handler:', e);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      data: null,
    });
  }
};

// Global error handler for uncaught errors
export const globalErrorHandler = (
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  // Convert all errors to AppError format
  if (!(err instanceof AppError)) {
    const statusCode = err instanceof MongooseError.ValidationError ? 400 : 500;
    const message = err.message || 'Internal server error';
    err = new AppError(message, statusCode);
  }
  next(err);
};
