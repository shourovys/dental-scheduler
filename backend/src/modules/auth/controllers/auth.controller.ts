import { NextFunction, Request, Response } from 'express';
import { ValidationError, validationResult } from 'express-validator';
import { AppError } from '../../../middleware/errorHandler';
import { BaseController } from '../../../utils/baseController';
import logger from '../../../utils/logger';
import authService from '../services/auth.service';

class AuthController extends BaseController {
  protected service = authService;

  constructor() {
    super();
    // Bind methods to preserve 'this' context
    this.signUp = this.signUp.bind(this);
    this.verifyOTP = this.verifyOTP.bind(this);
    this.resendOTP = this.resendOTP.bind(this);
    this.signIn = this.signIn.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.getMe = this.getMe.bind(this);
  }

  private formatValidationErrors(errors: ValidationError[]): Record<string, string> {
    const validationErrors: Record<string, string> = {};
    errors.forEach((err) => {
      const field = err.type === 'field' ? err.path : err.type;
      validationErrors[field] = err.msg;
    });
    return validationErrors;
  }

  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(req, res, next, async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = this.formatValidationErrors(errors.array());
        throw new AppError('Validation failed', 400, validationErrors);
      }

      const result = await this.service.signUp(req.body);

      // In production, send OTP via email/SMS
      logger.info(`OTP for user ${result.user.emailAddress}: ${result.otp}`);

      return {
        token: result.token,
        expiryTime: result.expiryTime,
        intervalTime: result.intervalTime,
      };
    });
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(req, res, next, async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = this.formatValidationErrors(errors.array());
        throw new AppError('Validation failed', 400, validationErrors);
      }

      const { token, otp } = req.body.attributes;
      const result = await this.service.verifyOTP(token, otp.toString());

      return { message: result.message };
    });
  }

  async resendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(req, res, next, async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = this.formatValidationErrors(errors.array());
        throw new AppError('Validation failed', 400, validationErrors);
      }

      const { email } = req.body;
      const otp = await this.service.resendOTP(email);

      // In production, send OTP via email/SMS
      logger.info(`New OTP for user ${email}: ${otp}`);

      return null;
    });
  }

  async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(req, res, next, async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = this.formatValidationErrors(errors.array());
        throw new AppError('Validation failed', 400, validationErrors);
      }

      const { email, password } = req.body.attributes;
      const result = await this.service.signIn(email, password);

      if ('passwordChangeRequired' in result) {
        return {
          passwordChangeRequired: result.passwordChangeRequired,
        };
      }

      return {
        body: {
          access_token: result.access_token,
          expires_in: result.expires_in,
          refresh_token: result.refresh_token,
          refresh_expires_in: result.refresh_expires_in,
        },
      };
    });
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(req, res, next, async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = this.formatValidationErrors(errors.array());
        throw new AppError('Validation failed', 400, validationErrors);
      }

      const { refresh_token } = req.body.attributes;
      const tokens = await this.service.refreshToken(refresh_token);

      return { accessTokenResponse: tokens };
    });
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(req, res, next, async () => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = this.formatValidationErrors(errors.array());
        throw new AppError('Validation failed', 400, validationErrors);
      }

      const { email, tempPassword, newPassword } = req.body.attributes;
      await this.service.resetPassword(email, tempPassword, newPassword);

      return { message: 'Password reset successfully' };
    });
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleRequest(req, res, next, async () => {
      const user = req.user;
      if (!user) {
        throw new AppError('Not authenticated', 401);
      }

      return {
        user: {
          email: user.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    });
  }
}

export default new AuthController();
