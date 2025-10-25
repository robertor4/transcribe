# Phase 1 MVP Launch - Pricing Strategy Implementation Plan

**Created:** October 24, 2025
**Status:** In Progress
**Branch:** `feature/pricing-mvp-phase1`
**Related Docs:** [Pricing Strategy](./2025-10-23_PRICING_STRATEGY.md)

---

## Executive Summary

This document outlines the complete implementation plan for Phase 1 (MVP Launch) of the Neural Summary pricing strategy. The goal is to launch with three tiers:
- **Free Tier:** 3 transcriptions/month, core analyses only
- **Professional Tier:** $29/month for 60 hours of audio
- **Pay-As-You-Go:** $1.50/hour with no subscription

**Timeline:** 5-6 weeks (1 full-time developer)
**Priority:** P0 - Required for revenue generation

---

## Table of Contents

1. [Backend Infrastructure](#1-backend-infrastructure)
2. [Frontend Implementation](#2-frontend-implementation)
3. [Stripe Configuration](#3-stripe-configuration)
4. [Environment Variables](#4-environment-variables)
5. [Analytics & Tracking](#5-analytics--tracking)
6. [Free Tier Limits Enforcement](#6-free-tier-limits-enforcement)
7. [Internationalization](#7-internationalization)
8. [Testing Strategy](#8-testing-strategy)
9. [Migration & Rollout](#9-migration--rollout)
10. [Documentation & Communications](#10-documentation--communications)
11. [Security & Compliance](#11-security--compliance)
12. [Post-Launch Monitoring](#12-post-launch-monitoring)

---

## 1. Backend Infrastructure

### 1.1 Database Schema Extensions

**File:** `packages/shared/src/types.ts`

Extend the `User` interface with subscription and usage tracking fields:

```typescript
export interface User {
  uid: string;
  email: string;
  emailVerified?: boolean;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  preferredLanguage?: string;
  createdAt: Date;
  updatedAt: Date;

  // NEW: Subscription fields
  subscriptionTier: 'free' | 'professional' | 'payg';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;

  // NEW: Usage tracking
  usageThisMonth: {
    hours: number;
    transcriptions: number;
    onDemandAnalyses: number;
    lastResetAt: Date;
  };

  // NEW: Pay-As-You-Go credits
  paygCredits?: number; // Remaining hours for PAYG users

  // Existing fields
  emailNotifications?: {
    enabled: boolean;
    onTranscriptionComplete?: boolean;
    digest?: 'immediate' | 'daily' | 'weekly';
  };
}
```

**New Types:**

```typescript
export interface SubscriptionTier {
  id: 'free' | 'professional' | 'business' | 'enterprise';
  name: string;
  price: {
    monthly?: number;
    annual?: number;
  };
  limits: {
    transcriptionsPerMonth?: number; // undefined = unlimited
    hoursPerMonth?: number; // undefined = unlimited
    maxFileDuration?: number; // minutes
    maxFileSize?: number; // bytes
    onDemandAnalysesPerMonth?: number; // undefined = unlimited
  };
  features: {
    coreAnalyses: boolean;
    onDemandAnalyses: boolean;
    translation: boolean;
    advancedSharing: boolean;
    batchUpload: boolean;
    priorityProcessing: boolean;
    apiAccess: boolean;
  };
}

export interface UsageRecord {
  id: string;
  userId: string;
  transcriptionId: string;
  durationSeconds: number;
  durationHours: number;
  type: 'transcription' | 'analysis' | 'translation';
  tier: 'free' | 'professional' | 'payg';
  cost?: number; // For PAYG or overages
  createdAt: Date;
}

export interface OverageCharge {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  hours: number;
  amount: number; // in cents
  periodStart: Date;
  periodEnd: Date;
  status: 'pending' | 'paid' | 'failed';
  createdAt: Date;
}
```

### 1.2 Stripe Integration Module

**Directory Structure:**
```
apps/api/src/stripe/
├── stripe.module.ts
├── stripe.service.ts
├── stripe.controller.ts
└── dto/
    ├── create-checkout-session.dto.ts
    ├── update-subscription.dto.ts
    └── webhook-event.dto.ts
```

**File:** `apps/api/src/stripe/stripe.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [ConfigModule, FirebaseModule, UsageModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
```

**File:** `apps/api/src/stripe/stripe.service.ts`

Key methods to implement:

```typescript
@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService,
    private usageService: UsageService,
  ) {
    this.stripe = new Stripe(
      this.configService.get('STRIPE_SECRET_KEY'),
      { apiVersion: '2023-10-16' }
    );
  }

  // Customer Management
  async createCustomer(userId: string, email: string): Promise<string>;
  async getCustomer(customerId: string): Promise<Stripe.Customer>;
  async updateCustomer(customerId: string, params: Stripe.CustomerUpdateParams);

  // Subscription Management
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session>;

  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Stripe.Subscription>;

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean
  ): Promise<Stripe.Subscription>;

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription>;

  // PAYG Management
  async createPaygTopupSession(
    userId: string,
    amount: number, // in cents
    hours: number,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session>;

  // Overage Billing
  async chargeOverage(
    customerId: string,
    hours: number,
    amount: number
  ): Promise<Stripe.Invoice>;

  // Webhook Handlers
  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session);
  async handleSubscriptionCreated(subscription: Stripe.Subscription);
  async handleSubscriptionUpdated(subscription: Stripe.Subscription);
  async handleSubscriptionDeleted(subscription: Stripe.Subscription);
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice);
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice);

  async constructWebhookEvent(
    payload: Buffer,
    signature: string
  ): Promise<Stripe.Event>;
}
```

**File:** `apps/api/src/stripe/stripe.controller.ts`

```typescript
@Controller('stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private logger: Logger
  ) {}

  @Post('create-checkout-session')
  @UseGuards(FirebaseAuthGuard)
  async createCheckoutSession(
    @Request() req,
    @Body() dto: CreateCheckoutSessionDto
  ) {
    // Create Stripe Checkout session for Professional plan
  }

  @Post('create-payg-session')
  @UseGuards(FirebaseAuthGuard)
  async createPaygSession(
    @Request() req,
    @Body() dto: CreatePaygSessionDto
  ) {
    // Create Stripe Checkout session for PAYG credits
  }

  @Post('cancel-subscription')
  @UseGuards(FirebaseAuthGuard)
  async cancelSubscription(@Request() req) {
    // Cancel user's subscription
  }

  @Post('webhook')
  @Header('Content-Type', 'application/json')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    // Verify and process Stripe webhooks
    const event = await this.stripeService.constructWebhookEvent(
      req.rawBody,
      signature
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.stripeService.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        await this.stripeService.handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.stripeService.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.stripeService.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.stripeService.handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.stripeService.handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
    }

    return { received: true };
  }

  @Get('subscription')
  @UseGuards(FirebaseAuthGuard)
  async getSubscription(@Request() req) {
    // Return user's current subscription details
  }

  @Get('billing-history')
  @UseGuards(FirebaseAuthGuard)
  async getBillingHistory(@Request() req) {
    // Return user's billing history from Stripe
  }
}
```

### 1.3 Usage Tracking Service

**Directory Structure:**
```
apps/api/src/usage/
├── usage.module.ts
├── usage.service.ts
└── usage.scheduler.ts
```

**File:** `apps/api/src/usage/usage.service.ts`

```typescript
@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService
  ) {}

  /**
   * Check if user has quota to process a transcription
   * @throws PaymentRequiredException if quota exceeded
   */
  async checkQuota(
    userId: string,
    fileSizeBytes: number,
    estimatedDurationMinutes: number
  ): Promise<void> {
    const user = await this.firebaseService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tier = user.subscriptionTier || 'free';
    const usage = user.usageThisMonth || { hours: 0, transcriptions: 0, onDemandAnalyses: 0 };

    // Check free tier limits
    if (tier === 'free') {
      if (usage.transcriptions >= 3) {
        throw new PaymentRequiredException(
          'Free tier limit reached (3 transcriptions/month). Upgrade to Professional for unlimited transcriptions.',
          'QUOTA_EXCEEDED_TRANSCRIPTIONS'
        );
      }
      if (estimatedDurationMinutes > 30) {
        throw new PaymentRequiredException(
          'File duration exceeds free tier limit (30 minutes). Upgrade to Professional.',
          'QUOTA_EXCEEDED_DURATION'
        );
      }
      if (fileSizeBytes > 100 * 1024 * 1024) {
        throw new PaymentRequiredException(
          'File size exceeds free tier limit (100MB). Upgrade to Professional.',
          'QUOTA_EXCEEDED_FILESIZE'
        );
      }
    }

    // Check Professional tier limits
    if (tier === 'professional') {
      const estimatedHours = estimatedDurationMinutes / 60;
      if (usage.hours + estimatedHours > 60) {
        // Professional users can go over - they'll be charged overages
        this.logger.warn(
          `User ${userId} will exceed Professional quota (60 hours). Current: ${usage.hours}, estimated: ${estimatedHours}`
        );
      }
    }

    // Check PAYG credits
    if (tier === 'payg') {
      const estimatedHours = estimatedDurationMinutes / 60;
      const requiredCredits = Math.ceil(estimatedHours * 1.5); // $1.50/hour
      if (!user.paygCredits || user.paygCredits < requiredCredits) {
        throw new PaymentRequiredException(
          `Insufficient PAYG credits. Required: ${requiredCredits}, Available: ${user.paygCredits || 0}. Purchase more credits to continue.`,
          'QUOTA_EXCEEDED_PAYG_CREDITS'
        );
      }
    }
  }

  /**
   * Track transcription usage after processing completes
   */
  async trackTranscription(
    userId: string,
    transcriptionId: string,
    durationSeconds: number
  ): Promise<void> {
    const user = await this.firebaseService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const durationHours = durationSeconds / 3600;
    const tier = user.subscriptionTier || 'free';
    const usage = user.usageThisMonth || {
      hours: 0,
      transcriptions: 0,
      onDemandAnalyses: 0,
      lastResetAt: new Date()
    };

    // Update usage
    usage.hours += durationHours;
    usage.transcriptions += 1;

    // Deduct PAYG credits if applicable
    if (tier === 'payg') {
      const cost = Math.ceil(durationHours * 1.5);
      const newCredits = (user.paygCredits || 0) - cost;
      await this.firebaseService.updateUser(userId, {
        paygCredits: Math.max(0, newCredits),
        usageThisMonth: usage,
        updatedAt: new Date(),
      });
    } else {
      await this.firebaseService.updateUser(userId, {
        usageThisMonth: usage,
        updatedAt: new Date(),
      });
    }

    // Create usage record for analytics
    await this.firebaseService.createUsageRecord({
      userId,
      transcriptionId,
      durationSeconds,
      durationHours,
      type: 'transcription',
      tier,
      cost: tier === 'payg' ? Math.ceil(durationHours * 1.5) : undefined,
      createdAt: new Date(),
    });

    this.logger.log(
      `Tracked transcription usage for user ${userId}: ${durationHours.toFixed(2)} hours (tier: ${tier})`
    );
  }

  /**
   * Calculate overage charges for Professional tier users
   */
  async calculateOverage(userId: string): Promise<number> {
    const user = await this.firebaseService.getUserById(userId);
    if (!user || user.subscriptionTier !== 'professional') {
      return 0;
    }

    const usage = user.usageThisMonth || { hours: 0, transcriptions: 0, onDemandAnalyses: 0 };
    const overage = Math.max(0, usage.hours - 60);

    // $0.50 per hour overage
    const overageCost = Math.ceil(overage * 0.50 * 100); // in cents

    return overageCost;
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
      updatedAt: new Date(),
    });

    this.logger.log(`Reset monthly usage for user ${userId}`);
  }

  /**
   * Get usage statistics for a user
   */
  async getUsageStats(userId: string): Promise<{
    tier: string;
    usage: any;
    limits: any;
    overage: number;
    percentUsed: number;
  }> {
    const user = await this.firebaseService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tier = user.subscriptionTier || 'free';
    const usage = user.usageThisMonth || { hours: 0, transcriptions: 0, onDemandAnalyses: 0 };

    const limits = {
      free: {
        transcriptions: 3,
        hours: undefined,
        onDemandAnalyses: 2,
      },
      professional: {
        transcriptions: undefined,
        hours: 60,
        onDemandAnalyses: undefined,
      },
      payg: {
        transcriptions: undefined,
        hours: undefined,
        onDemandAnalyses: undefined,
      },
    };

    const tierLimits = limits[tier];
    let percentUsed = 0;

    if (tier === 'free') {
      percentUsed = (usage.transcriptions / tierLimits.transcriptions) * 100;
    } else if (tier === 'professional') {
      percentUsed = (usage.hours / tierLimits.hours) * 100;
    }

    const overage = tier === 'professional' ? Math.max(0, usage.hours - 60) : 0;

    return {
      tier,
      usage,
      limits: tierLimits,
      overage,
      percentUsed: Math.min(100, percentUsed),
    };
  }
}
```

**File:** `apps/api/src/usage/usage.scheduler.ts`

```typescript
@Injectable()
export class UsageScheduler {
  private readonly logger = new Logger(UsageScheduler.name);

  constructor(
    private usageService: UsageService,
    private firebaseService: FirebaseService
  ) {}

  // Run on the 1st of every month at 00:00
  @Cron('0 0 1 * *')
  async handleMonthlyReset() {
    this.logger.log('Starting monthly usage reset for all users...');

    const users = await this.firebaseService.getAllUsers();
    let resetCount = 0;

    for (const user of users) {
      try {
        await this.usageService.resetMonthlyUsage(user.uid);
        resetCount++;
      } catch (error) {
        this.logger.error(`Failed to reset usage for user ${user.uid}:`, error);
      }
    }

    this.logger.log(`Monthly usage reset complete. Reset ${resetCount} users.`);
  }

  // Run daily to check for overage charges
  @Cron('0 2 * * *') // 2 AM daily
  async handleOverageCharges() {
    this.logger.log('Checking for Professional tier overage charges...');

    const professionalUsers = await this.firebaseService.getUsersByTier('professional');
    let chargedCount = 0;

    for (const user of professionalUsers) {
      try {
        const overage = await this.usageService.calculateOverage(user.uid);
        if (overage > 0 && user.stripeCustomerId) {
          // Create invoice for overage
          this.logger.log(`Charging user ${user.uid} overage: $${(overage / 100).toFixed(2)}`);
          // TODO: Call Stripe to create invoice item
          chargedCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to process overage for user ${user.uid}:`, error);
      }
    }

    this.logger.log(`Overage charges complete. Charged ${chargedCount} users.`);
  }
}
```

### 1.4 Subscription Guard

**File:** `apps/api/src/guards/subscription.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  PaymentRequiredException,
} from '@nestjs/common';
import { UsageService } from '../usage/usage.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private usageService: UsageService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by FirebaseAuthGuard

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Extract file info from request
    const file = request.file || request.body?.file;
    if (!file) {
      return true; // Not a file upload request
    }

    const fileSizeBytes = file.size;
    const estimatedDurationMinutes = this.estimateDuration(fileSizeBytes);

    // Check quota using UsageService
    await this.usageService.checkQuota(
      user.uid,
      fileSizeBytes,
      estimatedDurationMinutes
    );

    return true;
  }

  private estimateDuration(fileSizeBytes: number): number {
    // Rough estimate: 1MB ≈ 1 minute of audio
    return Math.ceil(fileSizeBytes / (1024 * 1024));
  }
}

@Injectable()
export class OnDemandAnalysisGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private usageService: UsageService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userData = await this.firebaseService.getUserById(user.uid);
    const tier = userData?.subscriptionTier || 'free';
    const usage = userData?.usageThisMonth || { hours: 0, transcriptions: 0, onDemandAnalyses: 0 };

    // Check free tier limit for on-demand analyses
    if (tier === 'free' && usage.onDemandAnalyses >= 2) {
      throw new PaymentRequiredException(
        'Free tier limit reached (2 on-demand analyses/month). Upgrade to Professional for unlimited analyses.',
        'QUOTA_EXCEEDED_ON_DEMAND_ANALYSES'
      );
    }

    return true;
  }
}
```

### 1.5 Modify Transcription Flow

**File:** `apps/api/src/transcription/transcription.service.ts`

Add usage tracking to the transcription flow:

```typescript
// In createTranscription method, BEFORE uploading file:
async createTranscription(
  userId: string,
  file: Express.Multer.File,
  analysisType?: AnalysisType,
  context?: string,
  contextId?: string,
): Promise<Transcription> {
  this.logger.log(
    `Creating transcription for user ${userId}, file: ${file.originalname}`,
  );

  // NEW: Check quota before processing
  const estimatedDuration = Math.ceil(file.size / (1024 * 1024)); // Rough estimate
  await this.usageService.checkQuota(userId, file.size, estimatedDuration);

  // ... existing upload and transcription code ...
}

// In transcribeAudioWithProgress method, AFTER transcription completes:
async transcribeAudioWithProgress(
  fileUrl: string,
  context?: string,
  onProgress?: (progress: number, message: string) => void,
): Promise<{
  text: string;
  language?: string;
  speakers?: Speaker[];
  // ...
}> {
  // ... existing transcription code ...

  // NEW: Track usage after completion
  const transcription = await this.firebaseService.getTranscription(userId, transcriptionId);
  if (transcription) {
    const durationSeconds = transcription.duration || 0;
    await this.usageService.trackTranscription(userId, transcriptionId, durationSeconds);
  }

  return result;
}
```

---

## 2. Frontend Implementation

### 2.1 Pricing Page

**File:** `apps/web/app/[locale]/pricing/page.tsx`

```typescript
import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { PricingCard } from '@/components/pricing/PricingCard';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { Check, X } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing - Neural Summary',
  description: 'Professional AI transcription starting at $29/month. Choose the plan that fits your needs.',
};

export default function PricingPage() {
  const t = useTranslations('pricing');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <PricingCard
              tier="free"
              price={0}
              title={t('tiers.free.title')}
              description={t('tiers.free.description')}
              features={[
                { text: t('tiers.free.features.transcriptions'), included: true },
                { text: t('tiers.free.features.duration'), included: true },
                { text: t('tiers.free.features.coreAnalyses'), included: true },
                { text: t('tiers.free.features.onDemand'), included: true },
                { text: t('tiers.free.features.translation'), included: false },
                { text: t('tiers.free.features.sharing'), included: true, note: 'Basic' },
              ]}
              ctaText={t('tiers.free.cta')}
              ctaLink="/login"
            />

            {/* Professional Tier */}
            <PricingCard
              tier="professional"
              price={29}
              title={t('tiers.professional.title')}
              description={t('tiers.professional.description')}
              featured={true}
              features={[
                { text: t('tiers.professional.features.hours'), included: true },
                { text: t('tiers.professional.features.unlimited'), included: true },
                { text: t('tiers.professional.features.allAnalyses'), included: true },
                { text: t('tiers.professional.features.translation'), included: true },
                { text: t('tiers.professional.features.advancedSharing'), included: true },
                { text: t('tiers.professional.features.batch'), included: true },
                { text: t('tiers.professional.features.priority'), included: true },
              ]}
              ctaText={t('tiers.professional.cta')}
              ctaLink="/checkout/professional"
            />

            {/* Pay-As-You-Go */}
            <PricingCard
              tier="payg"
              price={1.50}
              priceUnit="per hour"
              title={t('tiers.payg.title')}
              description={t('tiers.payg.description')}
              features={[
                { text: t('tiers.payg.features.noSubscription'), included: true },
                { text: t('tiers.payg.features.allFeatures'), included: true },
                { text: t('tiers.payg.features.noExpiry'), included: true },
                { text: t('tiers.payg.features.minimum'), included: true, note: '$15 min' },
              ]}
              ctaText={t('tiers.payg.cta')}
              ctaLink="/checkout/payg"
            />
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('comparison.title')}
          </h2>
          <FeatureComparisonTable />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('faq.title')}
          </h2>
          <PricingFAQ />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#cc3399] to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t('finalCta.title')}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {t('finalCta.subtitle')}
          </p>
          <a
            href="/login"
            className="inline-flex items-center px-8 py-4 bg-white text-[#cc3399] font-semibold text-lg rounded-xl shadow-lg hover:bg-gray-100 transition-all"
          >
            {t('finalCta.button')}
          </a>
        </div>
      </section>
    </div>
  );
}
```

**Component:** `apps/web/components/pricing/PricingCard.tsx`

```typescript
interface PricingCardProps {
  tier: 'free' | 'professional' | 'payg';
  price: number;
  priceUnit?: string;
  title: string;
  description: string;
  featured?: boolean;
  features: Array<{
    text: string;
    included: boolean;
    note?: string;
  }>;
  ctaText: string;
  ctaLink: string;
}

export function PricingCard({
  tier,
  price,
  priceUnit = 'per month',
  title,
  description,
  featured = false,
  features,
  ctaText,
  ctaLink,
}: PricingCardProps) {
  return (
    <div
      className={`
        relative bg-white rounded-2xl shadow-lg p-8
        ${featured ? 'ring-2 ring-[#cc3399] scale-105' : ''}
      `}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#cc3399] text-white px-4 py-1 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}

      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-700 mb-6">{description}</p>

      <div className="mb-6">
        <span className="text-5xl font-bold text-gray-900">${price}</span>
        <span className="text-gray-700 ml-2">{priceUnit}</span>
      </div>

      <a
        href={ctaLink}
        className={`
          block w-full py-3 px-6 rounded-lg text-center font-semibold transition-all mb-8
          ${
            featured
              ? 'bg-[#cc3399] text-white hover:bg-[#b82d89]'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }
        `}
      >
        {ctaText}
      </a>

      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start text-gray-700">
            {feature.included ? (
              <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
            )}
            <span>
              {feature.text}
              {feature.note && (
                <span className="text-sm text-gray-500 ml-2">({feature.note})</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 2.2 Checkout Flow

**File:** `apps/web/app/[locale]/checkout/[tier]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'use';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tier = params.tier as string;

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout/' + tier);
      return;
    }

    createCheckoutSession();
  }, [user, tier]);

  async function createCheckoutSession() {
    try {
      setLoading(true);

      const response = await apiClient.post('/stripe/create-checkout-session', {
        tier,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to create checkout session');
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <a
            href="/pricing"
            className="inline-block px-6 py-3 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89]"
          >
            Back to Pricing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#cc3399] mx-auto mb-4" />
        <p className="text-gray-700">Redirecting to checkout...</p>
      </div>
    </div>
  );
}
```

**File:** `apps/web/app/[locale]/checkout/success/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Trigger analytics event
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('checkout_completed', {
        session_id: sessionId,
      });
    }
  }, [user, sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Professional!
        </h1>
        <p className="text-gray-700 mb-8">
          Your subscription is now active. You have full access to all Professional features.
        </p>
        <a
          href="/dashboard"
          className="inline-block px-8 py-3 bg-[#cc3399] text-white font-semibold rounded-lg hover:bg-[#b82d89] transition-all"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
```

### 2.3 Subscription Management

**File:** `apps/web/app/[locale]/dashboard/settings/subscription/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { UsageIndicator } from '@/components/paywall/UsageIndicator';
import { PlanBadge } from '@/components/paywall/PlanBadge';
import { Loader2, CreditCard, Calendar, AlertCircle } from 'lucide-react';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  async function loadSubscriptionData() {
    try {
      setLoading(true);

      const [subResponse, usageResponse, historyResponse] = await Promise.all([
        apiClient.get('/stripe/subscription'),
        apiClient.get('/usage/stats'),
        apiClient.get('/stripe/billing-history'),
      ]);

      setSubscription(subResponse.data);
      setUsageStats(usageResponse.data);
      setBillingHistory(historyResponse.data);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      await apiClient.post('/stripe/cancel-subscription');
      alert('Your subscription will be cancelled at the end of the billing period.');
      loadSubscriptionData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  }

  async function handleUpgrade() {
    window.location.href = '/pricing';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#cc3399]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription & Usage</h1>

      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Plan</h2>
            <PlanBadge tier={usageStats?.tier || 'free'} />
          </div>
          {usageStats?.tier === 'free' && (
            <button
              onClick={handleUpgrade}
              className="px-6 py-2 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89]"
            >
              Upgrade to Professional
            </button>
          )}
        </div>

        {subscription && (
          <div className="space-y-2 text-gray-700">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-500" />
              <span>
                Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="flex items-center text-orange-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Your subscription will be cancelled on the next billing date</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage This Month</h2>
        {usageStats && (
          <>
            <UsageIndicator
              current={usageStats.usage.hours}
              limit={usageStats.limits.hours}
              unit="hours"
              percentUsed={usageStats.percentUsed}
            />
            {usageStats.tier === 'free' && (
              <UsageIndicator
                current={usageStats.usage.transcriptions}
                limit={usageStats.limits.transcriptions}
                unit="transcriptions"
                percentUsed={(usageStats.usage.transcriptions / usageStats.limits.transcriptions) * 100}
              />
            )}
            {usageStats.overage > 0 && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center text-orange-700">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="font-semibold">
                    Overage: {usageStats.overage.toFixed(2)} hours
                  </span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  You'll be charged ${(usageStats.overage * 0.50).toFixed(2)} for overage usage
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing History</h2>
        {billingHistory.length === 0 ? (
          <p className="text-gray-700">No billing history yet.</p>
        ) : (
          <div className="space-y-3">
            {billingHistory.map((invoice: any) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between border-b border-gray-200 pb-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    ${(invoice.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(invoice.created * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }
                    `}
                  >
                    {invoice.status}
                  </span>
                  <a
                    href={invoice.invoice_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#cc3399] hover:underline text-sm"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Subscription */}
      {usageStats?.tier === 'professional' && !subscription?.cancelAtPeriodEnd && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cancel Subscription</h2>
          <p className="text-gray-700 mb-4">
            Your subscription will remain active until the end of your current billing period.
          </p>
          <button
            onClick={handleCancelSubscription}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  );
}
```

### 2.4 Paywall Components

**Component:** `apps/web/components/paywall/QuotaExceededModal.tsx`

```typescript
interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotaType: 'transcriptions' | 'duration' | 'filesize' | 'payg_credits' | 'on_demand_analyses';
  currentTier: 'free' | 'professional' | 'payg';
}

export function QuotaExceededModal({
  isOpen,
  onClose,
  quotaType,
  currentTier,
}: QuotaExceededModalProps) {
  if (!isOpen) return null;

  const messages = {
    transcriptions: {
      title: 'Free Tier Limit Reached',
      description: 'You've used all 3 transcriptions this month. Upgrade to Professional for unlimited transcriptions.',
    },
    duration: {
      title: 'File Too Long for Free Tier',
      description: 'Free tier supports files up to 30 minutes. Upgrade to Professional for unlimited file duration.',
    },
    filesize: {
      title: 'File Too Large for Free Tier',
      description: 'Free tier supports files up to 100MB. Upgrade to Professional for larger files.',
    },
    payg_credits: {
      title: 'Insufficient Credits',
      description: 'You don't have enough PAYG credits. Purchase more credits to continue.',
    },
    on_demand_analyses: {
      title: 'Free Tier Limit Reached',
      description: 'You've used your 2 on-demand analyses this month. Upgrade to Professional for unlimited analyses.',
    },
  };

  const message = messages[quotaType];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{message.title}</h2>
        <p className="text-gray-700 mb-6">{message.description}</p>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <a
            href={quotaType === 'payg_credits' ? '/checkout/payg' : '/pricing'}
            className="flex-1 px-4 py-2 bg-[#cc3399] text-white rounded-lg hover:bg-[#b82d89] text-center"
          >
            {quotaType === 'payg_credits' ? 'Buy Credits' : 'Upgrade'}
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Component:** `apps/web/components/paywall/UsageIndicator.tsx`

```typescript
interface UsageIndicatorProps {
  current: number;
  limit: number | undefined; // undefined = unlimited
  unit: string;
  percentUsed: number;
}

export function UsageIndicator({ current, limit, unit, percentUsed }: UsageIndicatorProps) {
  const isUnlimited = limit === undefined;
  const isWarning = percentUsed >= 80 && percentUsed < 100;
  const isExceeded = percentUsed >= 100;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {current.toFixed(2)} {unit} {!isUnlimited && `/ ${limit}`}
        </span>
        {!isUnlimited && (
          <span className={`text-sm font-medium ${isExceeded ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-gray-700'}`}>
            {percentUsed.toFixed(0)}%
          </span>
        )}
      </div>

      {!isUnlimited && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${
              isExceeded ? 'bg-red-600' : isWarning ? 'bg-orange-500' : 'bg-[#cc3399]'
            }`}
            style={{ width: `${Math.min(100, percentUsed)}%` }}
          />
        </div>
      )}

      {isWarning && !isExceeded && (
        <p className="text-sm text-orange-600 mt-2">
          You're approaching your monthly limit. Consider upgrading to avoid interruptions.
        </p>
      )}

      {isExceeded && (
        <p className="text-sm text-red-600 mt-2">
          You've exceeded your monthly limit. Overage charges will apply.
        </p>
      )}
    </div>
  );
}
```

---

## 3. Stripe Configuration

### 3.1 Products & Prices Setup

**Manual Steps in Stripe Dashboard:**

1. **Create Products:**
   - Product 1: "Professional Plan"
     - Description: "60 hours of audio transcription per month with unlimited analyses"
   - Product 2: "PAYG Credits"
     - Description: "Pay-as-you-go credits for audio transcription"

2. **Create Prices:**
   - Professional Monthly: $29.00 USD, recurring monthly
     - Price ID: `price_prof_monthly`
   - Professional Annual: $290.00 USD, recurring yearly
     - Price ID: `price_prof_annual`
   - PAYG $15: $15.00 USD, one-time
     - Metadata: `hours: 10`
   - PAYG $30: $30.00 USD, one-time
     - Metadata: `hours: 20`
   - PAYG $50: $50.00 USD, one-time
     - Metadata: `hours: 33`
   - PAYG $100: $100.00 USD, one-time
     - Metadata: `hours: 67`

### 3.2 Webhook Configuration

**Endpoint:** `https://neuralsummary.com/api/stripe/webhook`

**Events to Subscribe:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.finalized`

---

## 4. Environment Variables

### Backend (.env)

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PROF_MONTHLY=price_...
STRIPE_PRICE_PROF_ANNUAL=price_...

# Frontend URL for redirects
FRONTEND_URL=https://neuralsummary.com

# Existing vars...
OPENAI_API_KEY=...
FIREBASE_PROJECT_ID=...
# ... etc
```

### Frontend (.env.local)

```bash
# Stripe Public Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# API URL
NEXT_PUBLIC_API_URL=https://api.neuralsummary.com

# Existing vars...
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... etc
```

---

## 5. Analytics & Tracking

### 5.1 Mixpanel Events

**New Events to Track:**

```typescript
// Pricing page views
analytics.track('pricing_page_viewed', {
  referrer: document.referrer,
  utm_source: queryParams.utm_source,
});

// Tier selection
analytics.track('tier_selected', {
  tier: 'professional',
  billing_period: 'monthly',
});

// Checkout started
analytics.track('checkout_started', {
  tier: 'professional',
  price: 29,
});

// Checkout completed
analytics.track('checkout_completed', {
  tier: 'professional',
  stripe_session_id: sessionId,
  amount: 2900, // in cents
});

// Quota exceeded
analytics.track('quota_exceeded', {
  tier: 'free',
  quota_type: 'transcriptions',
  usage: 3,
  limit: 3,
});

// Upgrade prompt shown
analytics.track('upgrade_prompt_shown', {
  location: 'dashboard',
  prompt_type: 'quota_exceeded',
});

// Subscription cancelled
analytics.track('subscription_cancelled', {
  tier: 'professional',
  cancel_at_period_end: true,
  reason: userProvidedReason,
});
```

### 5.2 Metrics to Track

**In Firestore:**

Create a `metrics` collection with documents:

```typescript
{
  date: Date,
  type: 'daily' | 'weekly' | 'monthly',
  metrics: {
    // Conversion metrics
    free_to_paid_conversion_rate: number,
    professional_signups: number,
    payg_purchases: number,

    // Revenue metrics
    mrr: number, // Monthly Recurring Revenue
    arr: number, // Annual Recurring Revenue
    arpu: number, // Average Revenue Per User

    // Usage metrics
    avg_usage_free: number,
    avg_usage_professional: number,
    overage_frequency: number,

    // Churn metrics
    churn_rate: number,
    cancelled_subscriptions: number,

    // Support metrics
    quota_exceeded_events: number,
    upgrade_prompt_conversions: number,
  }
}
```

---

## 6. Free Tier Limits Enforcement

### 6.1 Restrictions Summary

| Feature | Free | Professional | PAYG |
|---------|------|--------------|------|
| Transcriptions/month | 3 | Unlimited | Based on credits |
| Max file duration | 30 min | Unlimited | Unlimited |
| Max file size | 100MB | 5GB | 5GB |
| Core analyses | ✅ | ✅ | ✅ |
| On-demand analyses | 2/month | Unlimited | Unlimited |
| Translation | ❌ | ✅ | ✅ |
| Advanced sharing | ❌ | ✅ | ✅ |
| Batch upload | ❌ | ✅ | ✅ |
| Priority processing | ❌ | ✅ | ✅ |

### 6.2 Implementation Locations

**Quota Checks:**
- `apps/api/src/guards/subscription.guard.ts` - Before file upload
- `apps/api/src/usage/usage.service.ts` - During processing
- `apps/api/src/transcription/transcription.service.ts` - After transcription

**Frontend Warnings:**
- `apps/web/components/paywall/QuotaExceededModal.tsx` - When limits reached
- `apps/web/components/paywall/UpgradePrompt.tsx` - At 80% usage
- `apps/web/components/FileUploader.tsx` - Before upload validation

---

## 7. Internationalization (i18n)

### 7.1 Translation Keys

**File:** `apps/web/messages/en.json`

Add new sections:

```json
{
  "pricing": {
    "hero": {
      "title": "Professional transcription for the price of lunch",
      "subtitle": "Choose the plan that fits your needs. No hidden fees, cancel anytime."
    },
    "tiers": {
      "free": {
        "title": "Free",
        "description": "Try before you buy",
        "cta": "Start Free",
        "features": {
          "transcriptions": "3 transcriptions per month",
          "duration": "Max 30 minutes per file",
          "coreAnalyses": "Core analyses (Summary, Action Items, Communication)",
          "onDemand": "2 on-demand analyses per month",
          "translation": "Translation to 15 languages",
          "sharing": "Basic sharing (7-day expiration)"
        }
      },
      "professional": {
        "title": "Professional",
        "description": "For individual contributors",
        "cta": "Start Professional",
        "features": {
          "hours": "60 hours of audio per month",
          "unlimited": "Unlimited transcriptions",
          "allAnalyses": "All core + on-demand analyses",
          "translation": "Translation to 15 languages",
          "advancedSharing": "Advanced sharing (password, custom expiration)",
          "batch": "Batch upload (up to 10 files)",
          "priority": "Priority processing (2x faster)"
        }
      },
      "payg": {
        "title": "Pay-As-You-Go",
        "description": "No commitment",
        "cta": "Buy Credits",
        "features": {
          "noSubscription": "No monthly subscription",
          "allFeatures": "All Professional features",
          "noExpiry": "Credits never expire",
          "minimum": "Minimum purchase: $15 (10 hours)"
        }
      }
    },
    "comparison": {
      "title": "Compare Features"
    },
    "faq": {
      "title": "Frequently Asked Questions",
      "questions": {
        "cost": {
          "question": "How much does Neural Summary cost?",
          "answer": "Neural Summary offers a free tier with 3 transcriptions per month. Our Professional plan is $29/month for 60 hours of audio, and we offer flexible Pay-As-You-Go pricing at $1.50/hour."
        },
        "overage": {
          "question": "What happens if I exceed my monthly hours?",
          "answer": "No worries! Overages are automatically charged at $0.50/hour for Professional users. You'll receive an email notification when you reach 80% of your monthly limit."
        },
        "cancel": {
          "question": "Can I cancel anytime?",
          "answer": "Yes! You can cancel your subscription anytime. Your subscription will remain active until the end of your current billing period."
        }
      }
    },
    "finalCta": {
      "title": "Ready to get started?",
      "subtitle": "Join hundreds of professionals who save hours every week.",
      "button": "Start Free Trial"
    }
  },
  "subscription": {
    "currentPlan": "Current Plan",
    "usageThisMonth": "Usage This Month",
    "billingHistory": "Billing History",
    "cancelSubscription": "Cancel Subscription",
    "upgrade": "Upgrade",
    "downgrade": "Downgrade",
    "managePayment": "Manage Payment Method"
  },
  "paywall": {
    "quotaExceeded": {
      "transcriptions": {
        "title": "Free Tier Limit Reached",
        "description": "You've used all 3 transcriptions this month. Upgrade to Professional for unlimited transcriptions."
      },
      "duration": {
        "title": "File Too Long",
        "description": "Free tier supports files up to 30 minutes. Upgrade to Professional for unlimited duration."
      }
    },
    "upgradePrompt": {
      "title": "Upgrade to Professional",
      "subtitle": "Get unlimited transcriptions and advanced features",
      "cta": "View Plans"
    }
  },
  "checkout": {
    "processing": "Processing your payment...",
    "success": {
      "title": "Welcome to Professional!",
      "description": "Your subscription is now active.",
      "cta": "Go to Dashboard"
    },
    "cancel": {
      "title": "Checkout Cancelled",
      "description": "No charges were made.",
      "cta": "Back to Pricing"
    }
  }
}
```

Repeat for all supported languages (nl, de, fr, es).

---

## 8. Testing Strategy

### 8.1 Backend Unit Tests

**File:** `apps/api/src/stripe/stripe.service.spec.ts`

```typescript
describe('StripeService', () => {
  let service: StripeService;

  beforeEach(() => {
    // Mock Stripe
  });

  it('should create a checkout session for Professional plan', async () => {
    const session = await service.createCheckoutSession(
      'user123',
      'price_prof_monthly',
      'http://success',
      'http://cancel'
    );
    expect(session.url).toBeDefined();
  });

  it('should handle subscription webhook events', async () => {
    const event = {
      type: 'customer.subscription.created',
      data: { object: mockSubscription },
    };
    await service.handleSubscriptionCreated(event.data.object);
    // Assert user was updated in Firestore
  });
});
```

**File:** `apps/api/src/usage/usage.service.spec.ts`

```typescript
describe('UsageService', () => {
  it('should enforce free tier transcription limit', async () => {
    const user = {
      uid: 'user123',
      subscriptionTier: 'free',
      usageThisMonth: { transcriptions: 3, hours: 0 },
    };

    await expect(
      service.checkQuota(user.uid, 100 * 1024 * 1024, 10)
    ).rejects.toThrow('Free tier limit reached');
  });

  it('should track Professional tier usage correctly', async () => {
    await service.trackTranscription('user123', 'trans123', 3600);
    const stats = await service.getUsageStats('user123');
    expect(stats.usage.hours).toBe(1);
  });

  it('should calculate overage for Professional users', async () => {
    const user = {
      uid: 'user123',
      subscriptionTier: 'professional',
      usageThisMonth: { transcriptions: 20, hours: 65 },
    };

    const overage = await service.calculateOverage(user.uid);
    expect(overage).toBe(250); // 5 hours * $0.50 = $2.50 = 250 cents
  });
});
```

### 8.2 E2E Tests

**File:** `apps/api/test/e2e/checkout.e2e-spec.ts`

```typescript
describe('Checkout Flow (E2E)', () => {
  it('should complete Professional monthly checkout', async () => {
    // 1. Create checkout session
    const { body } = await request(app.getHttpServer())
      .post('/stripe/create-checkout-session')
      .send({ tier: 'professional', billing: 'monthly' })
      .expect(201);

    expect(body.url).toBeDefined();

    // 2. Simulate webhook event
    const webhookPayload = createMockWebhookEvent('checkout.session.completed');
    await request(app.getHttpServer())
      .post('/stripe/webhook')
      .set('stripe-signature', mockSignature)
      .send(webhookPayload)
      .expect(200);

    // 3. Verify user was upgraded
    const user = await firebaseService.getUserById('user123');
    expect(user.subscriptionTier).toBe('professional');
    expect(user.stripeSubscriptionId).toBeDefined();
  });

  it('should enforce free tier limits after checkout cancellation', async () => {
    // User starts checkout but cancels
    // Verify they're still on free tier
    await request(app.getHttpServer())
      .post('/transcription/upload')
      .attach('file', Buffer.from('...'), 'test4.mp3')
      .expect(402); // Payment Required
  });
});
```

### 8.3 Frontend E2E Tests (Playwright)

```typescript
test('Professional tier checkout flow', async ({ page }) => {
  // 1. Navigate to pricing page
  await page.goto('/pricing');
  await expect(page.locator('h1')).toContainText('Pricing');

  // 2. Click Professional tier CTA
  await page.locator('text=Start Professional').click();

  // 3. Should redirect to Stripe Checkout
  await page.waitForURL(/checkout\.stripe\.com/);
  expect(page.url()).toContain('checkout.stripe.com');

  // Note: Can't actually complete Stripe checkout in tests
  // Use Stripe test mode + mock webhooks for full flow
});
```

---

## 9. Migration & Rollout

### 9.1 Existing Users Migration

**File:** `apps/api/src/scripts/migrate-users-to-free-tier.ts`

```typescript
import * as admin from 'firebase-admin';

async function migrateExistingUsers() {
  const db = admin.firestore();
  const usersSnapshot = await db.collection('users').get();

  let migratedCount = 0;

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();

    // Skip if already has subscriptionTier
    if (userData.subscriptionTier) {
      continue;
    }

    // Set all existing users to free tier
    await doc.ref.update({
      subscriptionTier: 'free',
      usageThisMonth: {
        hours: 0,
        transcriptions: 0,
        onDemandAnalyses: 0,
        lastResetAt: new Date(),
      },
      updatedAt: new Date(),
    });

    migratedCount++;
  }

  console.log(`Migrated ${migratedCount} users to free tier`);
}

migrateExistingUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

### 9.2 Rollout Plan

**Week 1-2: Backend Development**
- ✅ Stripe module (service, controller, DTOs)
- ✅ Usage tracking service
- ✅ Subscription guard
- ✅ Update User schema
- ✅ Unit tests

**Week 2-3: Frontend Development**
- ✅ Pricing page
- ✅ Checkout flow
- ✅ Subscription settings
- ✅ Paywall components
- ✅ Landing page updates

**Week 3: Testing**
- ✅ Backend unit tests
- ✅ E2E tests
- ✅ Manual testing
- ✅ Stripe test mode validation

**Week 4: Migration & Soft Launch**
- ✅ Run migration script
- ✅ Deploy to staging
- ✅ Beta test with 10-20 users
- ✅ Fix bugs
- ✅ Send announcement emails

**Week 5: Public Launch**
- ✅ Deploy to production
- ✅ Marketing campaign
- ✅ Product Hunt launch
- ✅ Monitor metrics closely

---

## 10. Documentation & Communications

### 10.1 User Documentation

**File:** `docs/PRICING_FAQ.md`

```markdown
# Pricing FAQ

## General Questions

### How much does Neural Summary cost?
Neural Summary offers three pricing tiers:
- **Free**: 3 transcriptions/month, perfect for trying the platform
- **Professional**: $29/month for 60 hours of audio
- **Pay-As-You-Go**: $1.50/hour with no subscription

### What happens if I exceed my monthly hours?
Professional users are charged $0.50/hour for overages. You'll receive an email notification when you reach 80% of your monthly limit.

### Can I cancel anytime?
Yes! You can cancel your subscription anytime. Your subscription will remain active until the end of your current billing period.

## Free Tier Questions

### What are the free tier limits?
- 3 transcriptions per month
- Max 30 minutes per file
- Max 100MB file size
- Core analyses only (Summary, Action Items, Communication)
- 2 on-demand analyses per month
- Basic sharing (7-day expiration, no password)

### How do I upgrade from free to Professional?
Go to Settings → Subscription, or visit the Pricing page and click "Upgrade to Professional".

## Professional Tier Questions

### What's included in Professional?
- 60 hours of audio per month
- Unlimited transcriptions
- All core + on-demand analyses
- Translation to 15 languages
- Advanced sharing features
- Batch upload (up to 10 files)
- Priority processing (2x faster)

### What if I need more than 60 hours?
Overages are automatically charged at $0.50/hour. Alternatively, consider Pay-As-You-Go for variable usage.

## Payment Questions

### What payment methods do you accept?
We accept all major credit cards (Visa, Mastercard, American Express, Discover) via Stripe.

### Is my payment information secure?
Yes. We use Stripe for payment processing, which is PCI-compliant and used by millions of businesses worldwide.

### Can I get a refund?
Yes, we offer a 30-day money-back guarantee on your first payment.
```

### 10.2 Email Templates

**Welcome Email (Free Tier):**

```
Subject: Welcome to Neural Summary! 🎉

Hi [Name],

Thanks for signing up for Neural Summary!

You're on the **Free plan** with:
- 3 transcriptions per month
- Core AI analyses (Summary, Action Items, Communication)
- 2 on-demand analyses per month

Ready to get started? Upload your first audio file now:
[Go to Dashboard]

Need more? Upgrade to Professional ($29/month) for:
- 60 hours of audio per month
- Unlimited transcriptions and analyses
- Translation to 15 languages
- Advanced sharing features

[View Pricing]

Questions? Reply to this email anytime.

Best,
The Neural Summary Team
```

**Upgrade Confirmation:**

```
Subject: Welcome to Neural Summary Professional! 🚀

Hi [Name],

Your upgrade to Professional is complete!

You now have:
✅ 60 hours of audio per month
✅ Unlimited transcriptions
✅ All AI analyses + on-demand templates
✅ Translation to 15 languages
✅ Advanced sharing features
✅ Priority processing

Your next billing date: [Date]

[Go to Dashboard]

Need help? Reply to this email or visit our Help Center.

Best,
The Neural Summary Team
```

**Usage Warning (80% Quota):**

```
Subject: You're approaching your monthly limit

Hi [Name],

You've used 80% of your Professional plan quota:
- Used: 48 hours
- Remaining: 12 hours
- Resets: [Date]

What happens if I exceed 60 hours?
Overages are charged at $0.50/hour, automatically added to your next invoice.

Need more flexibility? Check out Pay-As-You-Go pricing:
[View Pricing]

[View Usage Dashboard]

Best,
The Neural Summary Team
```

---

## 11. Security & Compliance

### 11.1 Stripe Security Best Practices

1. **Webhook Signature Verification:**
   - Always verify `stripe-signature` header
   - Use `stripe.webhooks.constructEvent()`
   - Reject unverified requests immediately

2. **API Key Security:**
   - Store in environment variables (never commit)
   - Use restricted keys where possible
   - Rotate keys periodically

3. **HTTPS Only:**
   - All Stripe API calls over HTTPS
   - Webhook endpoint must be HTTPS
   - No mixed content

4. **PCI Compliance:**
   - Never log full card details
   - Use Stripe.js for client-side tokenization
   - Stripe handles PCI compliance

### 11.2 GDPR Compliance

**Data We Store:**
- Stripe Customer ID
- Subscription status
- Usage metrics
- Billing history references

**User Rights:**
- **Access:** Users can download all billing data
- **Deletion:** Delete Stripe customer on account deletion
- **Portability:** Export billing data as JSON

**Implementation:**

```typescript
// In user deletion handler
async function deleteUserAccount(userId: string) {
  const user = await firebaseService.getUserById(userId);

  // Cancel active subscriptions
  if (user.stripeSubscriptionId) {
    await stripeService.cancelSubscription(user.stripeSubscriptionId, false);
  }

  // Delete Stripe customer
  if (user.stripeCustomerId) {
    await stripe.customers.del(user.stripeCustomerId);
  }

  // Delete user data
  await firebaseService.deleteUser(userId);
}
```

---

## 12. Post-Launch Monitoring

### 12.1 Critical Metrics (First 30 Days)

**Target Metrics:**
- Free-to-paid conversion rate: **>5%**
- Payment success rate: **>95%**
- Monthly churn rate: **<5%**
- Average usage per tier: **Track trends**
- Overage frequency: **<10% of Professional users**

**Daily Monitoring:**
```typescript
{
  date: '2025-10-24',
  metrics: {
    new_signups: 25,
    free_users: 500,
    professional_users: 50,
    payg_users: 10,
    mrr: 1450, // 50 * $29
    free_to_paid_conversions: 3,
    conversion_rate: 6.0, // (3 / 50) * 100
    failed_payments: 1,
    cancelled_subscriptions: 0,
    avg_usage_professional: 25.5, // hours
    overage_count: 2,
  }
}
```

### 12.2 A/B Testing (Month 2-3)

**Test 1: Price Point Optimization**
- Control: $29/month
- Variant A: $39/month
- Variant B: $49/month
- Metric: Revenue per customer
- Duration: 4 weeks, 500+ visitors per variant

**Test 2: Annual Discount**
- Control: 17% discount (2 months free)
- Variant: 20% discount
- Metric: % choosing annual
- Duration: 4 weeks

**Test 3: Free Tier Limits**
- Control: 3 transcriptions/month
- Variant: 2 transcriptions/month
- Metric: Free-to-paid conversion rate
- Duration: 4 weeks

### 12.3 Alerts & Monitoring

**Set up alerts for:**
- Payment success rate drops below 90%
- Churn rate exceeds 5%
- Stripe webhook failures
- Quota check errors
- Free tier abuse (multiple accounts from same IP)

**Monitoring Tools:**
- Sentry for error tracking
- Mixpanel for analytics
- Stripe Dashboard for revenue
- Custom Firestore metrics dashboard

---

## Implementation Checklist

### Week 1-2: Backend

- [ ] Extend User interface in `packages/shared/src/types.ts`
- [ ] Create Stripe module (`stripe.module.ts`, `stripe.service.ts`, `stripe.controller.ts`)
- [ ] Create Usage Tracking Service (`usage.service.ts`, `usage.scheduler.ts`)
- [ ] Create Subscription Guard (`subscription.guard.ts`)
- [ ] Update Transcription Service with quota checks
- [ ] Write backend unit tests
- [ ] Add Stripe keys to environment variables

### Week 2-3: Frontend

- [ ] Create Pricing page (`/pricing/page.tsx`)
- [ ] Create PricingCard component
- [ ] Create FeatureComparisonTable component
- [ ] Create PricingFAQ component
- [ ] Create Checkout flow pages (`/checkout/[tier]`, `/success`, `/cancel`)
- [ ] Create Subscription Management page (`/dashboard/settings/subscription`)
- [ ] Create Paywall components (QuotaExceededModal, UpgradePrompt, UsageIndicator, PlanBadge)
- [ ] Update Landing page with pricing CTAs
- [ ] Add i18n translations for all new strings

### Week 3: Testing & Integration

- [ ] Write Stripe service unit tests
- [ ] Write Usage service unit tests
- [ ] Write E2E tests for checkout flow
- [ ] Manual testing of all user journeys
- [ ] Stripe test mode validation
- [ ] Test webhook processing

### Week 4: Migration & Launch Prep

- [ ] Create user migration script
- [ ] Run migration in staging environment
- [ ] Set up Stripe products & prices in dashboard
- [ ] Configure Stripe webhooks
- [ ] Prepare email templates
- [ ] Update user documentation
- [ ] Set up monitoring & alerts

### Week 5: Deployment

- [ ] Merge feature branch to develop
- [ ] Deploy to staging environment
- [ ] Beta test with 10-20 users
- [ ] Fix any bugs found in beta
- [ ] Deploy to production
- [ ] Send announcement emails
- [ ] Launch marketing campaign
- [ ] Monitor metrics closely

---

## Success Criteria

**Phase 1 is considered successful if:**

1. **Technical:**
   - ✅ All three tiers (Free, Professional, PAYG) are functional
   - ✅ Stripe integration works without errors
   - ✅ Usage tracking is accurate
   - ✅ Quota enforcement prevents abuse
   - ✅ Payment success rate > 95%

2. **Business:**
   - ✅ Free-to-paid conversion rate > 5%
   - ✅ Monthly churn rate < 5%
   - ✅ 50+ paying customers within 30 days
   - ✅ MRR > $1,500 within 30 days
   - ✅ NPS score > 40

3. **User Experience:**
   - ✅ Clear pricing communication (no confusion)
   - ✅ Smooth checkout flow (< 3 minutes)
   - ✅ Helpful quota warnings (at 80% usage)
   - ✅ Positive user feedback on pricing

---

## Next Steps (Phase 2)

After Phase 1 is successful, move to **Phase 2: Market Expansion (Months 4-6):**

- Launch **Business Tier** ($79/month for teams)
- Add team collaboration features
- Implement API access add-on
- Add white-label branding option
- Launch referral program
- Test annual billing incentives

---

**Document Version:** 1.0
**Last Updated:** October 24, 2025
**Status:** In Progress
**Next Review:** After MVP launch (Month 3)
