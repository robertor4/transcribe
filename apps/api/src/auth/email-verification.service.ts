import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as crypto from 'crypto';

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

  constructor(private firebaseService: FirebaseService) {}

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
      const hashedCode = this.hashCode(code);
      
      const verificationData: Omit<VerificationCode, 'code'> & { code: string } = {
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

      // Check if code has expired
      if (new Date() > new Date(data.expiresAt)) {
        await this.deleteVerificationCode(userId);
        return false;
      }

      // Check if max attempts exceeded
      if (data.attempts >= this.MAX_ATTEMPTS) {
        await this.deleteVerificationCode(userId);
        return false;
      }

      // Increment attempts
      await doc.ref.update({
        attempts: data.attempts + 1,
      });

      // Verify the code
      const hashedProvidedCode = this.hashCode(providedCode);
      if (hashedProvidedCode === data.code) {
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
      this.logger.error(`Error deleting verification code for user ${userId}:`, error);
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
   * Hash the verification code for secure storage
   */
  private hashCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update(code + process.env.JWT_SECRET)
      .digest('hex');
  }

  /**
   * Send verification email (placeholder - integrate with email service)
   */
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    // This is a placeholder. In production, integrate with:
    // - SendGrid
    // - AWS SES
    // - Firebase Email Extension
    // - Or any other email service
    
    this.logger.log(`Verification code for ${email}: ${code}`);
    
    // Example with SendGrid (requires @sendgrid/mail package):
    /*
    const msg = {
      to: email,
      from: 'noreply@neuralsummary.com',
      subject: 'Verify your Neural Summary account',
      html: `
        <h2>Welcome to Neural Summary!</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px;">${code}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    };
    await sgMail.send(msg);
    */
  }
}