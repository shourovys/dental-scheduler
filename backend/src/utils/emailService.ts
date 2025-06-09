import nodemailer from 'nodemailer';
import validateEnv from '../config/env';
import logger from './logger';

const env = validateEnv();

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendTempPassword(to: string, firstName: string, tempPassword: string): Promise<void> {
    try {
      const mailOptions = {
        from: env.EMAIL_FROM,
        to,
        subject: 'Your Temporary Password - eKYB System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to eKYB System</h2>
            <p>Dear ${firstName},</p>
            <p>Your account has been successfully verified. Here is your temporary password to log in:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <code style="font-size: 18px; color: #333;">${tempPassword}</code>
            </div>
            <p>For security reasons, please change your password immediately after logging in.</p>
            <p>If you did not request this password, please contact our support team immediately.</p>
            <p style="margin-top: 30px;">Best regards,<br>eKYB Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Temporary password email sent to ${to}`);
    } catch (error) {
      logger.error('Error sending temporary password email:', error);
      throw new Error('Failed to send temporary password email');
    }
  }
}

export default new EmailService();
