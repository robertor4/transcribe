import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

interface VerificationCode {
  code: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly CODE_EXPIRY_MINUTES = 15;
  private readonly BCRYPT_SALT_ROUNDS = 12; // Secure salt rounds for bcrypt

  constructor(
    private firebaseService: FirebaseService,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a 6-digit verification code
   */
  generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store verification code in Firestore
   */
  async storeVerificationCode(userId: string, email: string): Promise<string> {
    try {
      const code = this.generateVerificationCode();
      const hashedCode = await this.hashCode(code);

      const verificationData: Omit<VerificationCode, 'code'> & {
        code: string;
      } = {
        code: hashedCode,
        email,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000),
        attempts: 0,
      };

      await this.firebaseService.firestore
        .collection('email_verifications')
        .doc(userId)
        .set(verificationData);

      return code; // Return unhashed code to send to user
    } catch (error) {
      this.logger.error(`Error storing verification code for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Verify the code provided by the user
   */
  async verifyCode(userId: string, providedCode: string): Promise<boolean> {
    try {
      const doc = await this.firebaseService.firestore
        .collection('email_verifications')
        .doc(userId)
        .get();

      if (!doc.exists) {
        return false;
      }

      const data = doc.data() as VerificationCode;

      // Check expiry and attempts BEFORE verifying hash (prevent timing attacks)
      if (new Date() > new Date(data.expiresAt)) {
        await this.deleteVerificationCode(userId);
        return false;
      }

      if (data.attempts >= this.MAX_ATTEMPTS) {
        await this.deleteVerificationCode(userId);
        return false;
      }

      // Increment attempts before verification
      await doc.ref.update({
        attempts: data.attempts + 1,
      });

      // Verify using bcrypt (constant-time comparison)
      const isValid = await this.verifyCodeHash(providedCode, data.code);

      if (isValid) {
        // Mark user as verified
        await this.markUserAsVerified(userId);
        await this.deleteVerificationCode(userId);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error verifying code for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Mark user as email verified
   */
  async markUserAsVerified(userId: string): Promise<void> {
    try {
      await this.firebaseService.firestore
        .collection('users')
        .doc(userId)
        .update({
          emailVerified: true,
          updatedAt: new Date(),
        });

      // Also update Firebase Auth user
      await this.firebaseService.auth.updateUser(userId, {
        emailVerified: true,
      });
    } catch (error) {
      this.logger.error(`Error marking user ${userId} as verified:`, error);
      throw error;
    }
  }

  /**
   * Delete verification code from database
   */
  async deleteVerificationCode(userId: string): Promise<void> {
    try {
      await this.firebaseService.firestore
        .collection('email_verifications')
        .doc(userId)
        .delete();
    } catch (error) {
      this.logger.error(
        `Error deleting verification code for user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Check rate limiting for verification attempts
   */
  async checkRateLimit(userId: string): Promise<boolean> {
    try {
      const doc = await this.firebaseService.firestore
        .collection('email_verifications')
        .doc(userId)
        .get();

      if (!doc.exists) {
        return true; // No previous attempts
      }

      const data = doc.data() as VerificationCode;

      // Check if last attempt was within cooldown period (1 minute)
      const lastAttemptTime = data.createdAt;
      const now = new Date();
      const timeDiff = now.getTime() - new Date(lastAttemptTime).getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      return minutesDiff >= 1; // Allow if at least 1 minute has passed
    } catch (error) {
      this.logger.error(`Error checking rate limit for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Hash verification code using bcrypt (secure, slow hashing)
   * @param code - Verification code to hash
   * @returns Hashed code
   */
  private async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, this.BCRYPT_SALT_ROUNDS);
  }

  /**
   * Verify code against hash using bcrypt (constant-time comparison)
   * @param code - Plain text code
   * @param hash - Hashed code from database
   * @returns True if code matches hash
   */
  private async verifyCodeHash(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  /**
   * Send verification email with branded HTML template
   */
  async sendVerificationEmail(
    email: string,
    code: string,
    displayName?: string,
  ): Promise<boolean> {
    const html = this.generateVerificationEmailHtml(code, displayName);
    const text = this.generateVerificationEmailText(code, displayName);

    const sent = await this.emailService.sendRawEmail({
      to: email,
      subject: 'Verify your Neural Summary account',
      html,
      text,
    });

    if (sent) {
      this.logger.log(`Verification email sent to ${email}`);
    } else {
      this.logger.warn(`Failed to send verification email to ${email}`);
    }

    return sent;
  }

  private generateVerificationEmailHtml(
    code: string,
    displayName?: string,
  ): string {
    const greeting = displayName ? `Hi ${displayName},` : 'Hi there,';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Verify your email - Neural Summary</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #111827;
      margin: 0;
      padding: 40px 20px;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      font-weight: 600;
      text-align: center;
      margin: 0 0 10px 0;
    }
    .greeting {
      font-size: 16px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 20px;
    }
    .body-text {
      font-size: 15px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 30px;
    }
    .code-box {
      text-align: center;
      padding: 24px;
      background-color: #F5F3FF;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .code-text {
      font-size: 36px;
      font-weight: 700;
      color: #8D6AFA;
      letter-spacing: 10px;
      font-family: 'Montserrat', monospace;
    }
    .expiry-text {
      font-size: 13px;
      color: #9ca3af;
      text-align: center;
      margin-bottom: 30px;
    }
    .ignore-text {
      font-size: 14px;
      color: #9ca3af;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 25px;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #9ca3af;
      margin: 5px 0;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background: #23194B !important;
      }
      .container {
        background-color: #1E1B4B !important;
        color: #e5e7eb !important;
      }
      h1 {
        color: #f3f4f6 !important;
      }
      .greeting, .body-text {
        color: #d1d5db !important;
      }
      .code-box {
        background-color: #2D2657 !important;
      }
      .expiry-text, .ignore-text {
        color: #9ca3af !important;
      }
      .footer {
        border-top-color: #374151 !important;
      }
      .footer-text {
        color: #9ca3af !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="40" cellspacing="0" border="0" class="container" style="max-width: 600px; background-color: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <tr>
            <td>
              <div class="header" style="text-align: center; margin-bottom: 30px;">
                <img src="https://neuralsummary.com/assets/logos/neural-summary-logo.png" alt="Neural Summary" style="width: 200px; height: auto; margin: 0 auto;" />
              </div>

              <h1 style="color: #111827; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 10px 0;">Verify your email</h1>

              <p class="greeting" style="font-size: 16px; color: #6b7280; text-align: center; margin-bottom: 20px;">${greeting}</p>

              <p class="body-text" style="font-size: 15px; color: #6b7280; text-align: center; margin-bottom: 30px;">Enter this code to verify your Neural Summary account:</p>

              <div class="code-box" style="text-align: center; padding: 24px; background-color: #F5F3FF; border-radius: 8px; margin-bottom: 16px;">
                <span class="code-text" style="font-size: 36px; font-weight: 700; color: #8D6AFA; letter-spacing: 10px; font-family: 'Montserrat', monospace;">${code}</span>
              </div>

              <p class="expiry-text" style="font-size: 13px; color: #9ca3af; text-align: center; margin-bottom: 30px;">This code expires in ${this.CODE_EXPIRY_MINUTES} minutes.</p>

              <p class="ignore-text" style="font-size: 14px; color: #9ca3af; text-align: center;">If you didn't create a Neural Summary account, you can safely ignore this email.</p>

              <div class="footer" style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
                <p class="footer-text" style="font-size: 13px; color: #9ca3af; margin: 5px 0;">Neural Summary &mdash; Create with your voice.</p>
                <p class="footer-text" style="font-size: 12px; color: #9ca3af; margin: 5px 0;">You received this email because you created a Neural Summary account.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private generateVerificationEmailText(
    code: string,
    displayName?: string,
  ): string {
    const greeting = displayName ? `Hi ${displayName},` : 'Hi there,';
    return `${greeting}

Enter this code to verify your Neural Summary account:

${code}

This code expires in ${this.CODE_EXPIRY_MINUTES} minutes.

If you didn't create a Neural Summary account, you can safely ignore this email.

Neural Summary — Create with your voice.`;
  }
}
