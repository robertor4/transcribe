import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { UserService } from './user.service';
import { ApiResponse, User } from '@transcribe/shared';

@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req: Request): Promise<ApiResponse<User>> {
    const userId = (req as any).user.uid;
    const user = await this.userService.getUserProfile(userId);

    return {
      success: true,
      data: user || undefined,
    };
  }

  @Put('profile')
  async updateProfile(
    @Req() req: Request,
    @Body() profile: { displayName?: string; photoURL?: string },
  ): Promise<ApiResponse<User>> {
    const userId = (req as any).user.uid;
    const updatedUser = await this.userService.updateUserProfile(
      userId,
      profile,
    );

    return {
      success: true,
      data: updatedUser,
    };
  }

  @Put('preferences')
  async updatePreferences(
    @Req() req: Request,
    @Body() preferences: { preferredLanguage?: string },
  ): Promise<ApiResponse<User>> {
    const userId = (req as any).user.uid;
    const updatedUser = await this.userService.updateUserPreferences(
      userId,
      preferences,
    );

    return {
      success: true,
      data: updatedUser,
    };
  }

  @Put('email-notifications')
  async updateEmailNotifications(
    @Req() req: Request,
    @Body()
    emailNotifications: {
      enabled?: boolean;
      onTranscriptionComplete?: boolean;
      digest?: 'immediate' | 'daily' | 'weekly';
    },
  ): Promise<ApiResponse<User>> {
    const userId = (req as any).user.uid;
    const updatedUser = await this.userService.updateEmailNotifications(
      userId,
      emailNotifications,
    );

    return {
      success: true,
      data: updatedUser,
    };
  }
}
