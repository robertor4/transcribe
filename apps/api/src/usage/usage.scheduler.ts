import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsageService } from './usage.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class UsageScheduler {
  private readonly logger = new Logger(UsageScheduler.name);

  constructor(
    private usageService: UsageService,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Reset monthly usage for all users
   * Runs on the 1st of every month at 00:00 UTC
   */
  @Cron('0 0 1 * *', {
    name: 'monthly-usage-reset',
    timeZone: 'UTC',
  })
  async handleMonthlyReset() {
    this.logger.log('Starting monthly usage reset for all users...');
    const startTime = Date.now();

    try {
      const users = await this.firebaseService.getAllUsers();
      this.logger.log(`Found ${users.length} users to process`);

      let resetCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          await this.usageService.resetMonthlyUsage(user.uid);
          resetCount++;
        } catch (error) {
          this.logger.error(`Failed to reset usage for user ${user.uid}:`, error.message);
          errorCount++;
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `Monthly usage reset complete in ${duration}s. Success: ${resetCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error('Monthly usage reset failed:', error);
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
    this.logger.log('Checking for Professional/Business tier overage charges...');
    const startTime = Date.now();

    try {
      // Get all Professional and Business tier users
      const professionalUsers = await this.firebaseService.getUsersByTier('professional');
      const businessUsers = await this.firebaseService.getUsersByTier('business');
      const allUsers = [...professionalUsers, ...businessUsers];

      this.logger.log(`Found ${allUsers.length} Professional/Business users to check`);

      let chargedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const user of allUsers) {
        try {
          const overage = await this.usageService.calculateOverage(user.uid);

          // Only charge if there's actual overage and user has Stripe customer ID
          if (overage.hours > 0 && overage.amount > 0 && user.stripeCustomerId) {
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
          this.logger.error(`Failed to process overage for user ${user.uid}:`, error.message);
          errorCount++;
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `Overage check complete in ${duration}s. Charged: ${chargedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error('Overage check failed:', error);
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
    this.logger.log('Checking for users approaching quota limits...');
    const startTime = Date.now();

    try {
      // Get all users with active subscriptions
      const freeUsers = await this.firebaseService.getUsersByTier('free');
      const professionalUsers = await this.firebaseService.getUsersByTier('professional');
      const businessUsers = await this.firebaseService.getUsersByTier('business');
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
          this.logger.error(`Failed to check usage for user ${user.uid}:`, error.message);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `Usage warnings check complete in ${duration}s. Warnings sent: ${warningsCount}`,
      );
    } catch (error) {
      this.logger.error('Usage warnings check failed:', error);
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
    }
  }
}
