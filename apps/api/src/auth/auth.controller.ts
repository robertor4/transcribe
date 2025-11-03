import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { EmailVerificationService } from './email-verification.service';
import { UserService } from '../user/user.service';
import type { ApiResponse } from '@transcribe/shared';

interface VerifyEmailDto {
  code: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
    private readonly userService: UserService,
  ) {}

  @Post('signup')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 signups per minute
  signup(): ApiResponse<{ message: string }> {
    // This endpoint is called after Firebase Auth creates the user
    // We use it to trigger the verification email
    // The actual user creation is handled by Firebase Auth on the frontend

    // Note: In a production app, you might want to verify the user was actually created
    // by checking with Firebase Admin SDK

    return {
      success: true,
      data: {
        message: 'Signup initiated. Please check your email for verification.',
      },
    };
  }

  @Post('verify-email')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  async verifyEmail(
    @Req() req: AuthenticatedRequest,
    @Body() dto: VerifyEmailDto,
  ): Promise<ApiResponse<{ verified: boolean }>> {
    const userId: string = req.user.uid;

    const verified: boolean = await this.emailVerificationService.verifyCode(
      userId,
      dto.code,
    );

    if (!verified) {
      throw new HttpException(
        'Invalid or expired verification code',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      data: { verified },
    };
  }

  @Post('resend-verification')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 3, ttl: 600000 } }) // 3 resends per 10 minutes
  async resendVerification(
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    const userId: string = req.user.uid;
    const userEmail: string = req.user.email;

    // Check rate limiting
    const canSend: boolean =
      await this.emailVerificationService.checkRateLimit(userId);
    if (!canSend) {
      throw new HttpException(
        'Please wait before requesting another verification code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Generate and store new code
    const code: string =
      await this.emailVerificationService.storeVerificationCode(
        userId,
        userEmail,
      );

    // Send email
    this.emailVerificationService.sendVerificationEmail(userEmail, code);

    return {
      success: true,
      data: {
        message: 'Verification email sent',
      },
    };
  }

  @Post('send-verification-code')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 3, ttl: 600000 } }) // 3 sends per 10 minutes
  async sendVerificationCode(
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiResponse<{ message: string }>> {
    const userId: string = req.user.uid;
    const userEmail: string = req.user.email;

    // Generate and store code
    const code: string =
      await this.emailVerificationService.storeVerificationCode(
        userId,
        userEmail,
      );

    // Send email
    this.emailVerificationService.sendVerificationEmail(userEmail, code);

    return {
      success: true,
      data: {
        message: 'Verification code sent to your email',
      },
    };
  }
}
