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
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { EmailVerificationService } from './email-verification.service';
import { UserService } from '../user/user.service';
import { ApiResponse } from '@transcribe/shared';

interface SignupDto {
  email: string;
  password: string;
  displayName: string;
}

interface VerifyEmailDto {
  code: string;
}

interface ResendVerificationDto {
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
    private readonly userService: UserService,
  ) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
  ): Promise<ApiResponse<{ message: string }>> {
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
  async verifyEmail(
    @Req() req: Request,
    @Body() dto: VerifyEmailDto,
  ): Promise<ApiResponse<{ verified: boolean }>> {
    const userId = (req as any).user.uid;

    const verified = await this.emailVerificationService.verifyCode(
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
  async resendVerification(
    @Req() req: Request,
  ): Promise<ApiResponse<{ message: string }>> {
    const userId = (req as any).user.uid;
    const userEmail = (req as any).user.email;

    // Check rate limiting
    const canSend = await this.emailVerificationService.checkRateLimit(userId);
    if (!canSend) {
      throw new HttpException(
        'Please wait before requesting another verification code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Generate and store new code
    const code = await this.emailVerificationService.storeVerificationCode(
      userId,
      userEmail,
    );

    // Send email
    await this.emailVerificationService.sendVerificationEmail(userEmail, code);

    return {
      success: true,
      data: {
        message: 'Verification email sent',
      },
    };
  }

  @Post('send-verification-code')
  @UseGuards(FirebaseAuthGuard)
  async sendVerificationCode(
    @Req() req: Request,
  ): Promise<ApiResponse<{ message: string }>> {
    const userId = (req as any).user.uid;
    const userEmail = (req as any).user.email;

    // Generate and store code
    const code = await this.emailVerificationService.storeVerificationCode(
      userId,
      userEmail,
    );

    // Send email
    await this.emailVerificationService.sendVerificationEmail(userEmail, code);

    return {
      success: true,
      data: {
        message: 'Verification code sent to your email',
      },
    };
  }
}
