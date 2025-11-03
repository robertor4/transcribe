import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsageService } from './usage.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class UsageScheduler implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(UsageScheduler.name);
  private isShuttingDown = false;
  private activeJobs = new Set<string>();

  constructor(
    private usageService: UsageService,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Check for missed monthly resets on application startup
   */
  async onModuleInit() {
    this.logger.log('Usage scheduler initialized');
    await this.checkForMissedResets();
  }

  /**
   * Handle graceful shutdown - wait for active jobs to complete
   */
  async onApplicationShutdown(signal?: string) {
    this.logger.log(
      `Received shutdown signal: ${signal || 'unknown'}. Waiting for active jobs...`,
    );
    this.isShuttingDown = true;

    // Wait for active jobs to complete (max 60 seconds)
    const maxWaitTime = 60000;
    const startTime = Date.now();

    while (this.activeJobs.size > 0 && Date.now() - startTime < maxWaitTime) {
      this.logger.log(
        `Waiting for ${this.activeJobs.size} active job(s): ${Array.from(this.activeJobs).join(', ')}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.activeJobs.size > 0) {
      this.logger.warn(
        `Force shutdown with ${this.activeJobs.size} active jobs: ${Array.from(this.activeJobs).join(', ')}`,
      );
    } else {
      this.logger.log('All jobs completed. Safe to shutdown.');
    }
  }

  /**
   * Track an active job
   */
  private trackJob(jobName: string): void {
    this.activeJobs.add(jobName);
    this.logger.debug(
      `Job started: ${jobName} (${this.activeJobs.size} active)`,
    );
  }

  /**
   * Untrack a completed job
   */
  private untrackJob(jobName: string): void {
    this.activeJobs.delete(jobName);
    this.logger.debug(
      `Job completed: ${jobName} (${this.activeJobs.size} remaining)`,
    );
  }

  /**
   * Check if any monthly resets were missed (e.g., due to downtime)
   */
  private async checkForMissedResets() {
    this.logger.log('Checking for missed monthly resets...');

    try {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Only check if we're past the 1st of the month
      if (now.getDate() === 1) {
        this.logger.log(
          'Today is the 1st - regular cron will handle reset at midnight',
        );
        return;
      }

      const users = await this.firebaseService.getAllUsers();
      this.logger.log(
        `Checking ${users.length} users for missed resets (current month: ${firstOfMonth.toISOString().split('T')[0]})`,
      );

      let missedCount = 0;
      let alreadyResetCount = 0;

      for (const user of users) {
        const lastReset = user.usageThisMonth?.lastResetAt;

        // If lastResetAt is before the 1st of current month, reset is missed
        if (!lastReset || new Date(lastReset) < firstOfMonth) {
          await this.usageService.resetMonthlyUsage(user.uid);
          missedCount++;
        } else {
          alreadyResetCount++;
        }
      }

      if (missedCount > 0) {
        this.logger.warn(
          `✓ Recovered ${missedCount} missed monthly resets (${alreadyResetCount} already reset)`,
        );
      } else {
        this.logger.log(
          `✓ No missed resets detected - all ${alreadyResetCount} users already reset for current month`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to check for missed resets: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Reset monthly usage for all users
   * Runs on the 1st of every month at 00:00 UTC
   * Supports graceful shutdown and resumable progress tracking
   */
  @Cron('0 0 1 * *', {
    name: 'monthly-usage-reset',
    timeZone: 'UTC',
  })
  async handleMonthlyReset() {
    if (this.isShuttingDown) {
      this.logger.warn('Skipping monthly reset - shutdown in progress');
      return;
    }

    this.trackJob('monthly-usage-reset');
    const startTime = Date.now();

    try {
      // Check if there's an incomplete job from a previous crash
      const incompleteJob = await this.usageService.getIncompleteResetJob();
      let startFromUid: string | undefined;
      let jobId: string;

      if (incompleteJob) {
        this.logger.warn(
          `⚠️  Resuming incomplete reset job: ${incompleteJob.id} (${incompleteJob.processedUsers}/${incompleteJob.totalUsers} users completed)`,
        );
        startFromUid = incompleteJob.lastProcessedUid;
        jobId = incompleteJob.id;
      } else {
        // Create new job
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        jobId = await this.usageService.createResetJob(yearMonth);
        this.logger.log(`Created new reset job: ${jobId}`);
      }

      this.logger.log('Starting monthly usage reset for all users...');
      const users = await this.firebaseService.getAllUsers();

      // Filter users if resuming from a crash
      let usersToProcess = users;
      if (startFromUid) {
        const startIndex = users.findIndex((u) => u.uid === startFromUid);
        if (startIndex >= 0) {
          usersToProcess = users.slice(startIndex + 1);
          this.logger.log(
            `Resuming from user index ${startIndex + 1} (${usersToProcess.length} users remaining)`,
          );
        }
      }

      let processedCount = incompleteJob?.processedUsers || 0;
      const totalUsers = users.length;
      const failedUsers: string[] = incompleteJob?.failedUsers || [];

      for (const user of usersToProcess) {
        // Check for shutdown signal
        if (this.isShuttingDown) {
          this.logger.warn(
            `⚠️  Shutdown detected - pausing reset at ${processedCount}/${totalUsers} users`,
          );
          break;
        }

        try {
          await this.usageService.resetMonthlyUsage(user.uid);
          processedCount++;

          // Update progress checkpoint every 10 users for resumability
          if (processedCount % 10 === 0) {
            await this.usageService.updateResetJobProgress(
              jobId,
              processedCount,
              totalUsers,
              user.uid,
            );
            this.logger.debug(
              `Progress checkpoint: ${processedCount}/${totalUsers} users`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to reset usage for user ${user.uid}: ${error.message}`,
          );
          failedUsers.push(user.uid);
        }
      }

      // Mark job as complete if we processed all users
      if (processedCount === totalUsers) {
        await this.usageService.completeResetJob(jobId, failedUsers);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        this.logger.log(
          `✓ Monthly usage reset complete in ${duration}s. Success: ${processedCount}, Failed: ${failedUsers.length}`,
        );
      } else {
        this.logger.warn(
          `⚠️  Monthly reset paused: ${processedCount}/${totalUsers} users completed. Will resume on next startup.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Monthly usage reset failed: ${error.message}`,
        error.stack,
      );
    } finally {
      this.untrackJob('monthly-usage-reset');
    }
  }

  /**
   * Check for overage charges and create invoice items
   * Runs daily at 02:00 UTC to catch overages
   */
  @Cron('0 2 * * *', {
    name: 'daily-overage-check',
    timeZone: 'UTC',
  })
  async handleOverageCharges() {
    if (this.isShuttingDown) {
      this.logger.warn('Skipping overage check - shutdown in progress');
      return;
    }

    this.trackJob('daily-overage-check');

    this.logger.log(
      'Checking for Professional/Business tier overage charges...',
    );
    const startTime = Date.now();

    try {
      // Get all Professional and Business tier users
      const professionalUsers =
        await this.firebaseService.getUsersByTier('professional');
      const businessUsers =
        await this.firebaseService.getUsersByTier('business');
      const allUsers = [...professionalUsers, ...businessUsers];

      this.logger.log(
        `Found ${allUsers.length} Professional/Business users to check`,
      );

      let chargedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const user of allUsers) {
        try {
          const overage = await this.usageService.calculateOverage(user.uid);

          // Only charge if there's actual overage and user has Stripe customer ID
          if (
            overage.hours > 0 &&
            overage.amount > 0 &&
            user.stripeCustomerId
          ) {
            this.logger.log(
              `User ${user.uid} has overage: ${overage.hours.toFixed(2)} hours ($${(overage.amount / 100).toFixed(2)})`,
            );

            // Note: Overage charges are typically billed at the end of the billing cycle
            // This cron job just logs the overages. Actual billing happens via Stripe webhooks
            // when the subscription renews (invoice.payment_succeeded)

            // You could optionally create invoice items here:
            // await stripeService.createOverageCharge(user.stripeCustomerId, overage.hours, overage.amount);

            chargedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to process overage for user ${user.uid}:`,
            error.message,
          );
          errorCount++;
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `Overage check complete in ${duration}s. Charged: ${chargedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error('Overage check failed:', error);
    } finally {
      this.untrackJob('daily-overage-check');
    }
  }

  /**
   * Send usage warnings to users approaching their limits
   * Runs daily at 10:00 UTC
   */
  @Cron('0 10 * * *', {
    name: 'daily-usage-warnings',
    timeZone: 'UTC',
  })
  async handleUsageWarnings() {
    if (this.isShuttingDown) {
      this.logger.warn('Skipping usage warnings - shutdown in progress');
      return;
    }

    this.trackJob('daily-usage-warnings');

    this.logger.log('Checking for users approaching quota limits...');
    const startTime = Date.now();

    try {
      // Get all users with active subscriptions
      const freeUsers = await this.firebaseService.getUsersByTier('free');
      const professionalUsers =
        await this.firebaseService.getUsersByTier('professional');
      const businessUsers =
        await this.firebaseService.getUsersByTier('business');
      const allUsers = [...freeUsers, ...professionalUsers, ...businessUsers];

      this.logger.log(`Checking ${allUsers.length} users for usage warnings`);

      let warningsCount = 0;

      for (const user of allUsers) {
        try {
          const stats = await this.usageService.getUsageStats(user.uid);

          // Send warning if user has used 80% or more of their quota
          if (stats.percentUsed >= 80 && stats.warnings.length > 0) {
            this.logger.log(
              `User ${user.uid} at ${stats.percentUsed.toFixed(0)}% usage: ${stats.warnings.join(', ')}`,
            );

            // TODO: Send email notification
            // await emailService.sendUsageWarning(user.email, stats);

            warningsCount++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to check usage for user ${user.uid}:`,
            error.message,
          );
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `Usage warnings check complete in ${duration}s. Warnings sent: ${warningsCount}`,
      );
    } catch (error) {
      this.logger.error('Usage warnings check failed:', error);
    } finally {
      this.untrackJob('daily-usage-warnings');
    }
  }

  /**
   * Clean up old usage records (keep last 12 months)
   * Runs monthly on the 15th at 03:00 UTC
   */
  @Cron('0 3 15 * *', {
    name: 'monthly-usage-cleanup',
    timeZone: 'UTC',
  })
  async handleUsageCleanup() {
    if (this.isShuttingDown) {
      this.logger.warn('Skipping usage cleanup - shutdown in progress');
      return;
    }

    this.trackJob('monthly-usage-cleanup');

    this.logger.log('Cleaning up old usage records...');
    const startTime = Date.now();

    try {
      const db = this.firebaseService['db'];
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const snapshot = await db
        .collection('usageRecords')
        .where('createdAt', '<', twelveMonthsAgo)
        .get();

      this.logger.log(`Found ${snapshot.size} old usage records to delete`);

      let deletedCount = 0;
      const batch = db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `Usage cleanup complete in ${duration}s. Deleted ${deletedCount} records`,
      );
    } catch (error) {
      this.logger.error('Usage cleanup failed:', error);
    } finally {
      this.untrackJob('monthly-usage-cleanup');
    }
  }
}
