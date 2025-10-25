import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import { SUBSCRIPTION_TIERS } from '@transcribe/shared';
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
  ) {}

  /**
   * Check if user has quota to process a transcription
   * @throws PaymentRequiredException if quota exceeded
   */
  async checkQuota(
    userId: string,
    fileSizeBytes: number,
    estimatedDurationMinutes: number,
  ): Promise<void> {
    const user = await this.firebaseService.getUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tier = user.subscriptionTier || 'free';
    const usage = user.usageThisMonth || {
      hours: 0,
      transcriptions: 0,
      onDemandAnalyses: 0,
      lastResetAt: new Date(),
    };

    const tierLimits = SUBSCRIPTION_TIERS[tier];
    if (!tierLimits) {
      this.logger.error(`Invalid subscription tier: ${tier}`);
      throw new PaymentRequiredException(
        'Invalid subscription. Please contact support.',
        'INVALID_SUBSCRIPTION_TIER',
      );
    }

    this.logger.log(
      `Checking quota for user ${userId} (${tier}): ${usage.transcriptions} transcriptions, ${usage.hours.toFixed(2)} hours used`,
    );

    // Check free tier limits
    if (tier === 'free') {
      // Max 3 transcriptions per month
      if (
        tierLimits.limits.transcriptionsPerMonth &&
        usage.transcriptions >= tierLimits.limits.transcriptionsPerMonth
      ) {
        throw new PaymentRequiredException(
          `Free tier limit reached (${tierLimits.limits.transcriptionsPerMonth} transcriptions/month). Upgrade to Professional for unlimited transcriptions.`,
          'QUOTA_EXCEEDED_TRANSCRIPTIONS',
        );
      }

      // Max 30 minutes per file
      if (
        tierLimits.limits.maxFileDuration &&
        estimatedDurationMinutes > tierLimits.limits.maxFileDuration
      ) {
        throw new PaymentRequiredException(
          `File duration exceeds free tier limit (${tierLimits.limits.maxFileDuration} minutes). Upgrade to Professional for unlimited duration.`,
          'QUOTA_EXCEEDED_DURATION',
        );
      }

      // Max 100MB per file
      if (
        tierLimits.limits.maxFileSize &&
        fileSizeBytes > tierLimits.limits.maxFileSize
      ) {
        const maxSizeMB = Math.floor(tierLimits.limits.maxFileSize / (1024 * 1024));
        throw new PaymentRequiredException(
          `File size exceeds free tier limit (${maxSizeMB}MB). Upgrade to Professional for larger files (up to 5GB).`,
          'QUOTA_EXCEEDED_FILESIZE',
        );
      }
    }

    // Check Professional tier limits
    if (tier === 'professional') {
      const estimatedHours = estimatedDurationMinutes / 60;

      // Check monthly hour limit (60 hours/month)
      if (
        tierLimits.limits.hoursPerMonth &&
        usage.hours + estimatedHours > tierLimits.limits.hoursPerMonth
      ) {
        // Professional users can go over - they'll be charged overages at $0.50/hour
        const overage = usage.hours + estimatedHours - tierLimits.limits.hoursPerMonth;
        const overageCost = overage * 0.5;
        this.logger.warn(
          `User ${userId} will exceed Professional quota (${tierLimits.limits.hoursPerMonth} hours). Overage: ${overage.toFixed(2)} hours ($${overageCost.toFixed(2)})`,
        );

        // Allow processing but warn (overage will be charged)
        // Could optionally enforce a hard cap here (e.g., max 100 hours total)
        if (usage.hours + estimatedHours > 100) {
          throw new PaymentRequiredException(
            'Monthly usage limit reached (100 hours). Your overage charges are capped. Please contact support to increase your limit.',
            'QUOTA_EXCEEDED_HARD_CAP',
          );
        }
      }

      // Check file size limit (5GB for Professional)
      if (
        tierLimits.limits.maxFileSize &&
        fileSizeBytes > tierLimits.limits.maxFileSize
      ) {
        const maxSizeGB = Math.floor(tierLimits.limits.maxFileSize / (1024 * 1024 * 1024));
        throw new PaymentRequiredException(
          `File size exceeds Professional tier limit (${maxSizeGB}GB). Contact support for Enterprise tier.`,
          'QUOTA_EXCEEDED_FILESIZE',
        );
      }
    }

    // Check Business tier limits (similar to Professional but 200 hours/month)
    if (tier === 'business') {
      const estimatedHours = estimatedDurationMinutes / 60;

      if (
        tierLimits.limits.hoursPerMonth &&
        usage.hours + estimatedHours > tierLimits.limits.hoursPerMonth
      ) {
        const overage = usage.hours + estimatedHours - tierLimits.limits.hoursPerMonth;
        this.logger.warn(
          `User ${userId} will exceed Business quota (${tierLimits.limits.hoursPerMonth} hours). Overage: ${overage.toFixed(2)} hours`,
        );
      }

      // Check file size limit (5GB)
      if (
        tierLimits.limits.maxFileSize &&
        fileSizeBytes > tierLimits.limits.maxFileSize
      ) {
        const maxSizeGB = Math.floor(tierLimits.limits.maxFileSize / (1024 * 1024 * 1024));
        throw new PaymentRequiredException(
          `File size exceeds Business tier limit (${maxSizeGB}GB). Contact support for Enterprise tier.`,
          'QUOTA_EXCEEDED_FILESIZE',
        );
      }
    }

    // Check PAYG credits
    if (tier === 'payg') {
      const estimatedHours = estimatedDurationMinutes / 60;
      const requiredCredits = estimatedHours; // 1 credit = 1 hour
      const availableCredits = user.paygCredits || 0;

      if (availableCredits < requiredCredits) {
        throw new PaymentRequiredException(
          `Insufficient PAYG credits. Required: ${requiredCredits.toFixed(2)} hours, Available: ${availableCredits.toFixed(2)} hours. Purchase more credits to continue.`,
          'QUOTA_EXCEEDED_PAYG_CREDITS',
        );
      }

      // Check file size limit (5GB for PAYG)
      if (
        tierLimits.limits.maxFileSize &&
        fileSizeBytes > tierLimits.limits.maxFileSize
      ) {
        const maxSizeGB = Math.floor(tierLimits.limits.maxFileSize / (1024 * 1024 * 1024));
        throw new PaymentRequiredException(
          `File size exceeds PAYG tier limit (${maxSizeGB}GB). Contact support for Enterprise tier.`,
          'QUOTA_EXCEEDED_FILESIZE',
        );
      }
    }

    this.logger.log(`Quota check passed for user ${userId} (${tier})`);
  }

  /**
   * Check if user can generate on-demand analysis
   * @throws PaymentRequiredException if quota exceeded
   */
  async checkOnDemandAnalysisQuota(userId: string): Promise<void> {
    const user = await this.firebaseService.getUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tier = user.subscriptionTier || 'free';
    const usage = user.usageThisMonth || {
      hours: 0,
      transcriptions: 0,
      onDemandAnalyses: 0,
      lastResetAt: new Date(),
    };

    const tierLimits = SUBSCRIPTION_TIERS[tier];

    // Check free tier on-demand analysis limit (2/month)
    if (tier === 'free') {
      if (
        tierLimits.limits.onDemandAnalysesPerMonth &&
        usage.onDemandAnalyses >= tierLimits.limits.onDemandAnalysesPerMonth
      ) {
        throw new PaymentRequiredException(
          `Free tier limit reached (${tierLimits.limits.onDemandAnalysesPerMonth} on-demand analyses/month). Upgrade to Professional for unlimited analyses.`,
          'QUOTA_EXCEEDED_ON_DEMAND_ANALYSES',
        );
      }
    }

    // Professional, Business, Enterprise: unlimited on-demand analyses
    this.logger.log(`On-demand analysis quota check passed for user ${userId} (${tier})`);
  }

  /**
   * Track transcription usage after processing completes
   */
  async trackTranscription(
    userId: string,
    transcriptionId: string,
    durationSeconds: number,
  ): Promise<void> {
    const user = await this.firebaseService.getUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const durationHours = durationSeconds / 3600;
    const tier = user.subscriptionTier || 'free';
    const usage = user.usageThisMonth || {
      hours: 0,
      transcriptions: 0,
      onDemandAnalyses: 0,
      lastResetAt: new Date(),
    };

    // Update usage
    usage.hours += durationHours;
    usage.transcriptions += 1;

    this.logger.log(
      `Tracking transcription for user ${userId}: +${durationHours.toFixed(2)} hours, total: ${usage.hours.toFixed(2)} hours`,
    );

    // Deduct PAYG credits if applicable
    if (tier === 'payg') {
      const currentCredits = user.paygCredits || 0;
      const newCredits = Math.max(0, currentCredits - durationHours);

      await this.firebaseService.updateUser(userId, {
        paygCredits: newCredits,
        usageThisMonth: usage,
      });

      this.logger.log(
        `Deducted ${durationHours.toFixed(2)} PAYG credits from user ${userId}. Remaining: ${newCredits.toFixed(2)}`,
      );
    } else {
      await this.firebaseService.updateUser(userId, {
        usageThisMonth: usage,
      });
    }

    // Create usage record for analytics
    try {
      await this.createUsageRecord({
        userId,
        transcriptionId,
        durationSeconds,
        durationHours,
        type: 'transcription',
        tier,
        cost: tier === 'payg' ? Math.ceil(durationHours * 150) : undefined, // $1.50/hour in cents
      });
    } catch (error) {
      this.logger.error(`Failed to create usage record: ${error.message}`);
      // Don't fail the main operation if analytics fail
    }

    this.logger.log(`Usage tracking complete for user ${userId}`);
  }

  /**
   * Track on-demand analysis generation
   */
  async trackOnDemandAnalysis(userId: string, analysisId: string): Promise<void> {
    const user = await this.firebaseService.getUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tier = user.subscriptionTier || 'free';
    const usage = user.usageThisMonth || {
      hours: 0,
      transcriptions: 0,
      onDemandAnalyses: 0,
      lastResetAt: new Date(),
    };

    usage.onDemandAnalyses += 1;

    await this.firebaseService.updateUser(userId, {
      usageThisMonth: usage,
    });

    this.logger.log(
      `Tracked on-demand analysis for user ${userId}: ${usage.onDemandAnalyses} total`,
    );
  }

  /**
   * Calculate overage charges for Professional/Business tier users
   */
  async calculateOverage(userId: string): Promise<{
    hours: number;
    amount: number; // in cents
  }> {
    const user = await this.firebaseService.getUser(userId);
    if (!user) {
      return { hours: 0, amount: 0 };
    }

    const tier = user.subscriptionTier || 'free';
    const tierLimits = SUBSCRIPTION_TIERS[tier];

    // Only Professional and Business tiers have overage charges
    if (tier !== 'professional' && tier !== 'business') {
      return { hours: 0, amount: 0 };
    }

    const usage = user.usageThisMonth || { hours: 0, transcriptions: 0, onDemandAnalyses: 0 };
    const monthlyLimit = tierLimits.limits.hoursPerMonth || 0;
    const overage = Math.max(0, usage.hours - monthlyLimit);

    // $0.50 per hour overage
    const overageCost = Math.ceil(overage * 0.50 * 100); // in cents

    this.logger.log(
      `Calculated overage for user ${userId}: ${overage.toFixed(2)} hours = $${(overageCost / 100).toFixed(2)}`,
    );

    return {
      hours: overage,
      amount: overageCost,
    };
  }

  /**
   * Reset monthly usage (called by cron job)
   */
  async resetMonthlyUsage(userId: string): Promise<void> {
    await this.firebaseService.updateUser(userId, {
      usageThisMonth: {
        hours: 0,
        transcriptions: 0,
        onDemandAnalyses: 0,
        lastResetAt: new Date(),
      },
    });

    this.logger.log(`Reset monthly usage for user ${userId}`);
  }

  /**
   * Get usage statistics for a user
   */
  async getUsageStats(userId: string): Promise<{
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
  }> {
    const user = await this.firebaseService.getUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tier = user.subscriptionTier || 'free';
    const tierLimits = SUBSCRIPTION_TIERS[tier];
    const usage = user.usageThisMonth || {
      hours: 0,
      transcriptions: 0,
      onDemandAnalyses: 0,
    };

    const limits = {
      transcriptions: tierLimits.limits.transcriptionsPerMonth,
      hours: tierLimits.limits.hoursPerMonth,
      onDemandAnalyses: tierLimits.limits.onDemandAnalysesPerMonth,
    };

    // Calculate percent used based on primary limit
    let percentUsed = 0;
    if (tier === 'free' && limits.transcriptions) {
      percentUsed = (usage.transcriptions / limits.transcriptions) * 100;
    } else if ((tier === 'professional' || tier === 'business') && limits.hours) {
      percentUsed = (usage.hours / limits.hours) * 100;
    }

    // Calculate overage
    const overage = await this.calculateOverage(userId);

    // Generate warnings
    const warnings: string[] = [];
    if (percentUsed >= 80 && percentUsed < 100) {
      warnings.push(`You've used ${Math.floor(percentUsed)}% of your monthly quota`);
    }
    if (percentUsed >= 100) {
      warnings.push('You have exceeded your monthly quota');
    }
    if (overage.hours > 0) {
      warnings.push(
        `You have ${overage.hours.toFixed(2)} hours of overage charges ($${(overage.amount / 100).toFixed(2)})`,
      );
    }
    if (tier === 'payg' && user.paygCredits && user.paygCredits < 5) {
      warnings.push(`Low PAYG credits: ${user.paygCredits.toFixed(2)} hours remaining`);
    }

    return {
      tier,
      usage,
      limits,
      overage,
      percentUsed: Math.min(100, percentUsed),
      warnings,
    };
  }

  /**
   * Create usage record for analytics
   */
  private async createUsageRecord(record: {
    userId: string;
    transcriptionId: string;
    durationSeconds: number;
    durationHours: number;
    type: 'transcription' | 'analysis' | 'translation';
    tier: string;
    cost?: number;
  }): Promise<void> {
    const db = this.firebaseService['db'];

    // Filter out undefined values to avoid Firestore validation errors
    const filteredRecord = Object.entries(record).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as any,
    );

    await db.collection('usageRecords').add({
      ...filteredRecord,
      createdAt: new Date(),
    });
  }
}
