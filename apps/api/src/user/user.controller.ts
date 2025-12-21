import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { UserService } from './user.service';
import { UsageService } from '../usage/usage.service';
import { FirebaseService } from '../firebase/firebase.service';
import { ApiResponse, User } from '@transcribe/shared';

@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly usageService: UsageService,
    private readonly firebaseService: FirebaseService,
  ) {}

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

  @Post('profile/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadProfilePhoto(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<{ photoURL: string }>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = (req as any).user.uid;

    try {
      const photoURL = await this.userService.uploadProfilePhoto(userId, file);
      return {
        success: true,
        data: { photoURL },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to upload photo');
    }
  }

  @Delete('profile/photo')
  async deleteProfilePhoto(
    @Req() req: Request,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const userId = (req as any).user.uid;

    try {
      await this.userService.deleteProfilePhoto(userId);
      return {
        success: true,
        data: { success: true },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Failed to delete photo');
    }
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

  /**
   * Get usage statistics for current user
   * Includes tier, usage counts, limits, and reset date
   */
  @Get('usage-stats')
  async getUsageStats(@Req() req: Request): Promise<
    ApiResponse<{
      tier: string;
      usage: {
        hours: number;
        transcriptions: number;
        onDemandAnalyses: number;
      };
      limits: {
        transcriptions?: number;
        hours?: number;
        onDemandAnalyses?: number;
      };
      overage: {
        hours: number;
        amount: number;
      };
      percentUsed: number;
      warnings: string[];
      paygCredits?: number;
      resetDate: Date;
    }>
  > {
    const userId = (req as any).user.uid;

    // Ensure user profile exists (auto-creates with defaults for new users)
    const user = await this.userService.getUserProfile(userId);

    // Get usage stats from UsageService
    const stats = await this.usageService.getUsageStats(userId);

    // Calculate reset date (first day of next month)
    let lastReset = user?.usageThisMonth?.lastResetAt || new Date();

    // Convert Firestore Timestamp to Date if needed
    if (lastReset && typeof (lastReset as any).toDate === 'function') {
      lastReset = (lastReset as any).toDate();
    }

    // Defensive: If lastResetAt is before 2020 (e.g., Unix epoch), use current date
    const validResetDate =
      lastReset.getTime() < new Date('2020-01-01').getTime()
        ? new Date()
        : lastReset;

    const nextReset = new Date(validResetDate);
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1); // First day of next month

    return {
      success: true,
      data: {
        ...stats,
        paygCredits: user?.paygCredits,
        resetDate: nextReset,
      },
    };
  }

  /**
   * Delete user account
   * @query hardDelete - If 'true', permanently delete all user data (default: soft delete)
   *
   * SOFT DELETE (default):
   * - Marks user as deleted in Firestore
   * - Preserves all user data (transcriptions, analyses, files)
   * - Preserves Stripe subscription (no cancellation)
   * - Account can be recovered
   *
   * HARD DELETE (hardDelete=true):
   * - Deletes all transcriptions
   * - Deletes all generated analyses
   * - Deletes all storage files
   * - Cancels Stripe subscription and deletes customer (when implemented)
   * - Deletes Firestore user document
   * - Deletes Firebase Auth account
   * - IRREVERSIBLE - no recovery possible
   */
  @Delete('me')
  async deleteAccount(
    @Req() req: Request,
    @Query('hardDelete') hardDelete?: string,
  ): Promise<
    ApiResponse<{
      success: boolean;
      deletionType: 'soft' | 'hard';
      deletedData: {
        transcriptions?: number;
        analyses?: number;
        storageFiles?: number;
        authAccount?: boolean;
        firestoreUser?: boolean;
      };
      message: string;
    }>
  > {
    const userId = (req as any).user.uid;
    const userEmail = (req as any).user.email;
    const isHardDelete = hardDelete === 'true';

    this.logger.log(
      `Account deletion requested for user ${userId} (${userEmail}) - Type: ${isHardDelete ? 'HARD' : 'SOFT'}`,
    );

    const result = await this.userService.deleteAccount(userId, isHardDelete);

    const message = isHardDelete
      ? `Account permanently deleted. All data has been removed and cannot be recovered.`
      : `Account deactivated. Your data has been preserved and can be recovered by contacting support.`;

    this.logger.log(
      `Account deletion completed for user ${userId} - Result:`,
      result,
    );

    return {
      success: true,
      data: {
        ...result,
        message,
      },
    };
  }
}
