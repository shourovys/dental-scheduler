import { Response } from 'express';

export class ApiResponseBuilder {
  static success(res: Response, data: unknown, message = 'Success'): void {
    res.status(200).json({
      status: 'success',
      message,
      data,
    });
  }

  static fail(
    res: Response,
    message: string,
    statusCode = 400,
    errors?: Record<string, string>,
  ): void {
    res.status(statusCode).json({
      status: 'fail',
      message,
      errors,
      data: null,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: Record<string, string>,
  ): void {
    const response: any = {
      status: statusCode.toString().startsWith('4') ? 'fail' : 'error',
      message,
      errors,
      data: null,
    };

    if (process.env.NODE_ENV === 'development' && errors?.stack) {
      response.stack = errors.stack;
    }

    res.status(statusCode).json(response);
  }
}
