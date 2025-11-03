import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { FirebaseService } from '../firebase/firebase.service';
import { UserService } from '../user/user.service';
import { ApiResponse, User, UserActivity } from '@transcribe/shared';

/**
 * Admin Controller
 * Provides admin-only endpoints for user management
 * All endpoints require both authentication and admin role
 */
@Controller('admin')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
  ) {}

  /**
   * Get all users in the system
   * @returns List of all users with their profiles
   */
  @Get('users')
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    this.logger.log('Admin: Fetching all users');

    const users = await this.firebaseService.getAllUsers();

    this.logger.log(`Admin: Returned ${users.length} users`);

    return {
      success: true,
      data: users,
    };
  }

  /**
   * Get users by subscription tier
   * @param tier - The subscription tier to filter by
   * @returns List of users in that tier
   */
  @Get('users/tier/:tier')
  async getUsersByTier(
    @Param('tier') tier: string,
  ): Promise<ApiResponse<User[]>> {
    this.logger.log(`Admin: Fetching users by tier: ${tier}`);

    const users = await this.firebaseService.getUsersByTier(tier);

    this.logger.log(`Admin: Returned ${users.length} users for tier ${tier}`);

    return {
      success: true,
      data: users,
    };
  }

  /**
   * Get detailed user information by user ID
   * @param userId - The user ID to fetch
   * @returns Full user profile with all details
   */
  @Get('users/:userId')
  async getUserDetails(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<User>> {
    this.logger.log(`Admin: Fetching user details for ${userId}`);

    const user = await this.firebaseService.getUser(userId);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      data: user,
    };
  }

  /**
   * Get comprehensive user activity for audit purposes
   * @param userId - The user ID to fetch activity for
   * @returns Complete user activity including transcriptions, analyses, usage, and events
   */
  @Get('users/:userId/activity')
  async getUserActivity(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<UserActivity>> {
    this.logger.log(`Admin: Fetching activity for user ${userId}`);

    const activity = await this.firebaseService.getUserActivity(userId);

    if (!activity) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    this.logger.log(
      `Admin: Returned activity for ${userId} - ${activity.summary.totalTranscriptions} transcriptions, ${activity.summary.totalAnalysesGenerated} analyses`,
    );

    return {
      success: true,
      data: activity,
    };
  }

  /**
   * Delete user account (admin override)
   * @param userId - The user ID to delete
   * @param hardDelete - If 'true', permanently delete all data
   * @returns Deletion result with statistics
   */
  @Delete('users/:userId')
  async deleteUser(
    @Param('userId') userId: string,
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
    const isHardDelete = hardDelete === 'true';

    this.logger.log(
      `Admin: Deleting user ${userId} - Type: ${isHardDelete ? 'HARD' : 'SOFT'}`,
    );

    // Get user info before deletion for logging
    const user = await this.firebaseService.getUser(userId);
    const userEmail = user?.email || 'unknown';

    const result = await this.userService.deleteAccount(userId, isHardDelete);

    const message = isHardDelete
      ? `User ${userEmail} (${userId}) permanently deleted by admin. All data has been removed.`
      : `User ${userEmail} (${userId}) soft-deleted by admin. Data preserved for potential recovery.`;

    this.logger.log(
      `Admin: User deletion completed for ${userId} - Result:`,
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
