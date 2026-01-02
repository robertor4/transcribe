import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception';
import { UserRole } from '@transcribe/shared';

/**
 * Subscription Guard - Enforces quota limits before allowing transcription
 * Use on transcription upload endpoints
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  constructor(
    private usageService: UsageService,
    private userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by FirebaseAuthGuard

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user is admin - bypass all quota checks
    const userProfile = await this.userRepository.getUser(user.uid);
    if (userProfile?.role === UserRole.ADMIN) {
      this.logger.log(
        `Admin bypass: Skipping quota check for admin user ${user.uid}`,
      );
      return true;
    }

    // Extract file info from request
    const file = request.file || request.files?.[0];
    if (!file) {
      // Not a file upload request, allow through
      return true;
    }

    const fileSizeBytes = file.size;
    const estimatedDurationMinutes = this.estimateDuration(
      fileSizeBytes,
      file.mimetype,
    );

    this.logger.log(
      `Checking quota for user ${user.uid}: file size ${(fileSizeBytes / (1024 * 1024)).toFixed(2)}MB, estimated ${estimatedDurationMinutes} minutes`,
    );

    try {
      // Check quota using UsageService
      await this.usageService.checkQuota(
        user.uid,
        fileSizeBytes,
        estimatedDurationMinutes,
      );
      return true;
    } catch (error) {
      // If it's a PaymentRequiredException, re-throw with additional details
      if (error instanceof PaymentRequiredException) {
        this.logger.warn(
          `Quota exceeded for user ${user.uid}: ${error.message}`,
        );
        throw error;
      }
      // Other errors should fail closed
      this.logger.error(`Error checking quota for user ${user.uid}:`, error);
      throw error;
    }
  }

  /**
   * Estimate audio duration based on file size and mime type
   * This is a rough estimate - actual duration will be determined after transcription
   */
  private estimateDuration(fileSizeBytes: number, mimeType: string): number {
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    // Different compression rates for different formats
    // These are rough estimates in MB per minute
    const compressionRates: Record<string, number> = {
      'audio/mp3': 1.0, // ~1MB per minute
      'audio/mpeg': 1.0,
      'audio/m4a': 0.8, // Better compression
      'audio/x-m4a': 0.8,
      'audio/mp4': 0.8,
      'audio/wav': 10.0, // Uncompressed, ~10MB per minute
      'audio/flac': 6.0, // Lossless, ~6MB per minute
      'audio/ogg': 0.7,
      'audio/webm': 0.7,
      'video/mp4': 2.0, // Video files tend to be larger
      'video/webm': 1.5,
      default: 1.0, // Default assumption
    };

    const rate = compressionRates[mimeType] || compressionRates.default;
    const estimatedMinutes = Math.ceil(fileSizeMB / rate);

    // Cap estimate at reasonable max (e.g., 8 hours = 480 minutes)
    return Math.min(estimatedMinutes, 480);
  }
}

/**
 * On-Demand Analysis Guard - Enforces quota limits for generating analyses
 * Use on on-demand analysis endpoints
 */
@Injectable()
export class OnDemandAnalysisGuard implements CanActivate {
  private readonly logger = new Logger(OnDemandAnalysisGuard.name);

  constructor(
    private usageService: UsageService,
    private userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user is admin - bypass all quota checks
    const userProfile = await this.userRepository.getUser(user.uid);
    if (userProfile?.role === UserRole.ADMIN) {
      this.logger.log(
        `Admin bypass: Skipping on-demand analysis quota check for admin user ${user.uid}`,
      );
      return true;
    }

    this.logger.log(`Checking on-demand analysis quota for user ${user.uid}`);

    try {
      await this.usageService.checkOnDemandAnalysisQuota(user.uid);
      return true;
    } catch (error) {
      if (error instanceof PaymentRequiredException) {
        this.logger.warn(
          `On-demand analysis quota exceeded for user ${user.uid}: ${error.message}`,
        );
        throw error;
      }
      this.logger.error(
        `Error checking on-demand analysis quota for user ${user.uid}:`,
        error,
      );
      throw error;
    }
  }
}
