import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { UsageService } from './usage.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('usage')
@UseGuards(FirebaseAuthGuard)
export class UsageController {
  private readonly logger = new Logger(UsageController.name);

  constructor(private usageService: UsageService) {}

  /**
   * Get current reset job status
   * Only accessible by admin users for monitoring
   */
  @Get('reset-status')
  @UseGuards(AdminGuard)
  async getResetStatus() {
    try {
      const incompleteJob = await this.usageService.getIncompleteResetJob();

      if (!incompleteJob) {
        return {
          status: 'idle',
          message: 'No active reset job',
        };
      }

      return {
        status: 'in_progress',
        jobId: incompleteJob.id,
        startedAt: incompleteJob.startedAt,
        progress: {
          processed: incompleteJob.processedUsers,
          total: incompleteJob.totalUsers,
          percentage:
            incompleteJob.totalUsers > 0
              ? Math.round(
                  (incompleteJob.processedUsers / incompleteJob.totalUsers) *
                    100,
                )
              : 0,
        },
        failedUsers: incompleteJob.failedUsers?.length || 0,
        lastProcessedUid: incompleteJob.lastProcessedUid,
      };
    } catch (error) {
      this.logger.error(`Failed to get reset status: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Get specific reset job by ID
   * Only accessible by admin users for monitoring
   */
  @Get('reset-job/:jobId')
  @UseGuards(AdminGuard)
  async getResetJob(jobId: string) {
    try {
      const job = await this.usageService.getResetJobStatus(jobId);

      if (!job) {
        return {
          status: 'not_found',
          message: `Reset job ${jobId} not found`,
        };
      }

      return {
        status: 'success',
        job,
      };
    } catch (error) {
      this.logger.error(`Failed to get reset job ${jobId}: ${error.message}`);
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
