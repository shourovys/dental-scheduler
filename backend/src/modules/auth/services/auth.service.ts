import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import validateEnv from '../../../config/env';
import { AppError } from '../../../middleware/errorHandler';
import { BaseService } from '../../../utils/baseService';
import emailService from '../../../utils/emailService';
import logger from '../../../utils/logger';
import User, { IUser } from '../models/user.model';

const env = validateEnv();

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  emailAddress: string;
  mobileNumber: string;
  countryId: string;
}

interface MetaInfo {
  deviceId: string;
  deviceType: string;
  deviceName: string;
  appVersion: string;
  osVersion: string;
  ipAddress: string;
  timestamp: string;
}

interface SignUpRequest {
  metaInfo: MetaInfo;
  attributes: SignUpData;
}

class AuthService extends BaseService<IUser> {
  constructor() {
    super(User);
  }

  private generateTokens(user: IUser): TokenResponse {
    const accessToken = jwt.sign(
      { userId: user._id, email: user.emailAddress, name: `${user.firstName} ${user.lastName}` },
      env.JWT_SECRET,
      {
        expiresIn: parseInt(env.JWT_ACCESS_EXPIRATION),
      },
    );

    const refreshToken = randomBytes(40).toString('hex');

    return {
      access_token: accessToken,
      expires_in: parseInt(env.JWT_ACCESS_EXPIRATION),
      refresh_token: refreshToken,
      refresh_expires_in: parseInt(env.JWT_REFRESH_EXPIRATION),
    };
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async signUp(request: SignUpRequest): Promise<{
    user: IUser;
    otp: string;
    token: string;
    expiryTime: number;
    intervalTime: number;
  }> {
    try {
      const userData = request.attributes;

      // Validate email is not null or empty
      if (!userData.emailAddress?.trim()) {
        throw new AppError('Email address is required', 400, {
          emailAddress: 'Email address is required',
        });
      }

      // Normalize email
      userData.emailAddress = userData.emailAddress.trim().toLowerCase();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.emailAddress)) {
        throw new AppError('Invalid email format', 400, {
          emailAddress: 'Please enter a valid email address',
        });
      }

      // Check for existing user
      let user = await this.findOne({ emailAddress: userData.emailAddress });

      if (user) {
        if (user.isVerified) {
          throw new AppError(
            'This email is already registered. Please sign in or use a different email address.',
            409,
            {
              emailAddress:
                'This email is already registered. Please sign in or use a different email address.',
            },
          );
        }

        // Check if OTP is still valid
        if (user.otp && user.otpExpiresAt && user.otpExpiresAt > new Date()) {
          return {
            user,
            otp: user.otp,
            token: jwt.sign({ userId: user._id }, env.JWT_SECRET, {
              expiresIn: '10m',
            }),
            expiryTime: Math.floor((user.otpExpiresAt.getTime() - Date.now()) / 1000),
            intervalTime: 30,
          };
        }

        // Update existing unverified user
        user.firstName = userData.firstName.trim();
        user.lastName = userData.lastName.trim();
        user.mobileNumber = userData.mobileNumber.trim();
      } else {
        try {
          // Create new user
          user = await this.create({
            firstName: userData.firstName.trim(),
            lastName: userData.lastName.trim(),
            emailAddress: userData.emailAddress,
            mobileNumber: userData.mobileNumber.trim(),
          });
        } catch (error) {
          // Handle MongoDB duplicate key error
          if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
            throw new AppError(
              'This email is already registered. Please sign in or use a different email address.',
              409,
              {
                emailAddress:
                  'This email is already registered. Please sign in or use a different email address.',
              },
            );
          }
          throw new AppError('Error creating user', 500);
        }
      }

      const otp = '123456';
      // const otp = this.generateOTP();
      user.otp = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

      try {
        await user.save();
      } catch (error) {
        throw new AppError('Error saving user', 500);
      }

      // Generate temporary token for OTP verification
      const tempToken = jwt.sign({ userId: user._id }, env.JWT_SECRET, {
        expiresIn: '10m',
      });

      logger.info(
        `User ${user.isVerified ? 'updated' : 'created'} successfully with ID: ${user._id}`,
      );
      return {
        user,
        otp,
        token: tempToken,
        expiryTime: 600, // 10 minutes in seconds
        intervalTime: 30, // Resend OTP interval in seconds
      };
    } catch (error) {
      // Ensure all errors are AppError instances with proper format
      if (error instanceof AppError) {
        throw error;
      }
      // Handle MongoDB duplicate key error
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        throw new AppError(
          'This email is already registered. Please sign in or use a different email address.',
          409,
          {
            emailAddress:
              'This email is already registered. Please sign in or use a different email address.',
          },
        );
      }
      // Convert any other error to AppError
      throw new AppError(error instanceof Error ? error.message : 'Internal server error', 500);
    }
  }

  private generateTempPassword(): string {
    // Generate a random password with letters, numbers, and special characters
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  async verifyOTP(token: string, otp: string): Promise<{ message: string }> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const user = await this.findById(decoded.userId);

      if (!user) {
        throw new AppError('Invalid token', 401);
      }

      if (!user.otp || !user.otpExpiresAt) {
        throw new AppError('OTP has expired. Please request a new one', 400);
      }

      if (user.otpExpiresAt < new Date()) {
        throw new AppError('OTP has expired. Please request a new one', 400);
      }

      if (user.otp !== otp) {
        throw new AppError('Invalid OTP', 400);
      }

      // Generate temporary password
      // const tempPassword = this.generateTempPassword();
      const tempPassword = '123456';
      user.password = tempPassword;
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      // Send email with temporary password
      try {
        logger.info(`Temporary password sent to ${user.emailAddress} password is ${tempPassword}`);
        await emailService.sendTempPassword(user.emailAddress, user.firstName, tempPassword);
      } catch (error) {
        logger.error('Failed to send temporary password email:', error);
        // Don't throw error here, just log it. The user is still verified.
      }

      return {
        message: 'OTP verified successfully. Please check your email for temporary password.',
      };
    } catch (error) {
      logger.error('Error verifying OTP:', { error, token });
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      }
      throw error;
    }
  }

  async resendOTP(email: string): Promise<string> {
    const user = await this.findOne({ emailAddress: email });
    if (!user) {
      throw new AppError('User not found', 404, {
        email: 'No account found with this email address',
      });
    }

    const otp = '123456';
    // const otp = this.generateOTP();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return otp;
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<TokenResponse | { passwordChangeRequired: boolean }> {
    const user = await this.findOne({ emailAddress: email });
    if (!user) {
      throw new AppError('Invalid credentials', 401, {
        email: 'Invalid email or password',
      });
    }

    if (!user.password || !user.comparePassword) {
      throw new AppError('Please complete your registration', 403, {
        email: 'Please complete your registration process',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, {
        password: 'Invalid email or password',
      });
    }

    if (!user.isVerified) {
      throw new AppError('Please verify your email first', 403, {
        email: 'Please verify your email address to continue',
      });
    }

    const tokens = this.generateTokens(user);
    user.refreshToken = tokens.refresh_token;
    user.refreshTokenExpiresAt = new Date(Date.now() + tokens.refresh_expires_in * 1000);

    // Check if this is first login with temporary password
    const passwordChangeRequired = !user.hasChangedPassword;

    await user.save();

    if (passwordChangeRequired) {
      return { passwordChangeRequired };
    }

    return { ...tokens };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const user = await this.findOne({
      refreshToken,
      refreshTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired refresh token', 401, {
        refresh_token: 'Your session has expired. Please sign in again',
      });
    }

    const tokens = this.generateTokens(user);
    user.refreshToken = tokens.refresh_token;
    user.refreshTokenExpiresAt = new Date(Date.now() + tokens.refresh_expires_in * 1000);
    await user.save();

    return tokens;
  }

  async resetPassword(email: string, tempPassword: string, newPassword: string): Promise<void> {
    const user = await this.findOne({ emailAddress: email });
    if (!user) {
      throw new AppError('User not found', 404, {
        email: 'No account found with this email address',
      });
    }

    // Verify the temporary password
    if (!user.comparePassword) {
      throw new AppError('Password comparison not available', 500);
    }
    const isPasswordValid = await user.comparePassword(tempPassword);
    if (!isPasswordValid) {
      throw new AppError('Invalid temporary password', 401, {
        tempPassword: 'The temporary password you entered is incorrect',
      });
    }

    user.password = newPassword;
    user.hasChangedPassword = true;
    await user.save();
  }
}

export default new AuthService();
