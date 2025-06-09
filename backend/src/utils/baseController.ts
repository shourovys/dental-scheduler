import { NextFunction, Request, Response } from 'express';
import { ApiResponseBuilder } from './apiResponse';
import { BaseService } from './baseService';
import logger from './logger';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    reason: string | null;
  };
  metaData?: {
    requestId: string | null;
    transactionId: string;
    eventTime: string;
    status: boolean;
  };
}

export abstract class BaseController {
  protected abstract service: BaseService<any>;

  protected async handleRequest(
    req: Request,
    res: Response,
    next: NextFunction,
    action: () => Promise<any>,
  ): Promise<void> {
    try {
      const result = await action();
      if (result === null || result === undefined) {
        ApiResponseBuilder.fail(res, 'Resource not found', 404);
      } else {
        ApiResponseBuilder.success(res, result);
      }
    } catch (error) {
      logger.error('Controller error:', {
        error,
        path: req.path,
        method: req.method,
        body: req.body,
      });
      next(error);
    }
  }

  protected async handlePaginatedRequest(
    req: Request,
    res: Response,
    next: NextFunction,
    action: () => Promise<{ data: any[]; total: number; page: number; limit: number }>,
  ): Promise<void> {
    try {
      const result = await action();
      ApiResponseBuilder.success(res, {
        items: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      logger.error('Controller pagination error:', {
        error,
        path: req.path,
        method: req.method,
        query: req.query,
      });
      next(error);
    }
  }

  protected getPaginationParams(req: Request): { page: number; limit: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    return { page, limit };
  }

  protected getSortParams(req: Request): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {};
    const sortQuery = req.query.sort as string;

    if (sortQuery) {
      const fields = sortQuery.split(',');
      fields.forEach((field) => {
        const order = field.startsWith('-') ? -1 : 1;
        const key = field.replace(/^-/, '');
        sort[key] = order;
      });
    }

    return sort;
  }

  protected getFilterParams(req: Request, allowedFields: string[]): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    Object.keys(req.query).forEach((key) => {
      if (allowedFields.includes(key)) {
        const value = req.query[key];
        if (value !== undefined && value !== '') {
          filter[key] = value;
        }
      }
    });

    return filter;
  }

  protected async handleStreamRequest(
    req: Request,
    res: Response,
    next: NextFunction,
    action: () => Promise<NodeJS.ReadableStream>,
  ): Promise<void> {
    try {
      const stream = await action();
      stream.pipe(res);
      stream.on('error', (error) => {
        logger.error('Stream error:', {
          error,
          path: req.path,
          method: req.method,
        });
        next(error);
      });
    } catch (error) {
      logger.error('Stream setup error:', {
        error,
        path: req.path,
        method: req.method,
      });
      next(error);
    }
  }

  protected ok<T>(res: Response, { data, message }: { data?: T; message: string }): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    res.status(200).json(response);
  }

  protected created<T>(res: Response, { data, message }: { data?: T; message: string }): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    res.status(201).json(response);
  }

  protected error(
    res: Response,
    { message, error, status = 500 }: { message: string; error?: any; status?: number },
  ): void {
    const response: ApiResponse<null> = {
      success: false,
      message,
      error: {
        reason: error?.message || null,
      },
    };
    res.status(status).json(response);
  }
}
