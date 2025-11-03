import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Analytics Service
 *
 * Handles server-side event tracking to Google Analytics 4
 * using the Measurement Protocol API.
 *
 * @see https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

interface GA4Event {
  name: string;
  params: Record<string, any>;
}

interface GA4MeasurementPayload {
  client_id: string;
  user_id?: string;
  events: GA4Event[];
  user_properties?: Record<string, { value: any }>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly measurementId: string;
  private readonly apiSecret: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.measurementId =
      this.configService.get<string>('GA4_MEASUREMENT_ID') || '';
    this.apiSecret = this.configService.get<string>('GA4_API_SECRET') || '';
    this.enabled = !!(this.measurementId && this.apiSecret);

    if (!this.enabled) {
      this.logger.warn(
        'GA4 analytics disabled: Missing GA4_MEASUREMENT_ID or GA4_API_SECRET',
      );
    } else {
      this.logger.log(
        `GA4 analytics enabled with measurement ID: ${this.measurementId}`,
      );
    }
  }

  /**
   * Track a purchase event (server-side)
   *
   * @param userId - Firebase user ID
   * @param transactionId - Stripe session or subscription ID
   * @param value - Transaction value
   * @param currency - ISO 4217 currency code
   * @param tier - Subscription tier
   * @param billingCycle - monthly or annual
   */
  async trackPurchase(
    userId: string,
    transactionId: string,
    value: number,
    currency: string,
    tier: string,
    billingCycle: string = 'monthly',
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.sendEvent(userId, {
        name: 'purchase',
        params: {
          transaction_id: transactionId,
          value: value,
          currency: currency,
          items: [
            {
              item_id: `${tier}_${billingCycle}`,
              item_name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
              item_category: 'Subscription',
              item_category2: billingCycle,
              price: value,
              quantity: 1,
            },
          ],
          affiliation: 'Neural Summary',
          source: 'server',
        },
      });

      this.logger.log(
        `Purchase tracked: User ${userId}, Transaction ${transactionId}, Value ${value} ${currency}`,
      );
    } catch (error) {
      this.logger.error(`Failed to track purchase: ${error.message}`, error.stack);
    }
  }

  /**
   * Track a refund event (server-side)
   *
   * @param userId - Firebase user ID
   * @param transactionId - Original transaction ID
   * @param value - Refund amount
   * @param currency - ISO 4217 currency code
   * @param tier - Subscription tier
   */
  async trackRefund(
    userId: string,
    transactionId: string,
    value: number,
    currency: string,
    tier: string,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.sendEvent(userId, {
        name: 'refund',
        params: {
          transaction_id: transactionId,
          value: value,
          currency: currency,
          items: [
            {
              item_id: `${tier}_subscription`,
              item_name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
              item_category: 'Subscription',
              price: value,
              quantity: 1,
            },
          ],
          affiliation: 'Neural Summary',
          source: 'server',
        },
      });

      this.logger.log(
        `Refund tracked: User ${userId}, Transaction ${transactionId}, Value ${value} ${currency}`,
      );
    } catch (error) {
      this.logger.error(`Failed to track refund: ${error.message}`, error.stack);
    }
  }

  /**
   * Track subscription update (upgrade/downgrade)
   *
   * @param userId - Firebase user ID
   * @param subscriptionId - Stripe subscription ID
   * @param fromTier - Previous tier
   * @param toTier - New tier
   * @param value - New subscription value
   * @param currency - ISO 4217 currency code
   */
  async trackSubscriptionUpdate(
    userId: string,
    subscriptionId: string,
    fromTier: string,
    toTier: string,
    value: number,
    currency: string,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.sendEvent(userId, {
        name: 'subscription_updated',
        params: {
          subscription_id: subscriptionId,
          from_tier: fromTier,
          to_tier: toTier,
          value: value,
          currency: currency,
          source: 'server',
        },
      });

      this.logger.log(
        `Subscription update tracked: User ${userId}, ${fromTier} -> ${toTier}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to track subscription update: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Track payment failure
   *
   * @param userId - Firebase user ID
   * @param reason - Failure reason
   * @param tier - Subscription tier
   */
  async trackPaymentFailed(
    userId: string,
    reason: string,
    tier?: string,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.sendEvent(userId, {
        name: 'payment_failed',
        params: {
          failure_reason: reason,
          tier: tier,
          source: 'server',
        },
      });

      this.logger.log(`Payment failure tracked: User ${userId}, Reason: ${reason}`);
    } catch (error) {
      this.logger.error(
        `Failed to track payment failure: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Track recurring payment success
   *
   * @param userId - Firebase user ID
   * @param invoiceId - Stripe invoice ID
   * @param value - Payment amount
   * @param currency - ISO 4217 currency code
   * @param tier - Subscription tier
   */
  async trackRecurringPayment(
    userId: string,
    invoiceId: string,
    value: number,
    currency: string,
    tier: string,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.sendEvent(userId, {
        name: 'recurring_payment_succeeded',
        params: {
          invoice_id: invoiceId,
          value: value,
          currency: currency,
          tier: tier,
          source: 'server',
        },
      });

      this.logger.log(
        `Recurring payment tracked: User ${userId}, Invoice ${invoiceId}, Value ${value} ${currency}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to track recurring payment: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Send event to GA4 Measurement Protocol
   *
   * @param userId - Firebase user ID
   * @param event - GA4 event object
   */
  private async sendEvent(userId: string, event: GA4Event): Promise<void> {
    const payload: GA4MeasurementPayload = {
      client_id: userId, // Use Firebase UID as client ID
      user_id: userId,
      events: [event],
      user_properties: {
        user_type: {
          value: 'authenticated',
        },
      },
    };

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `GA4 API returned ${response.status}: ${response.statusText}`,
      );
    }

    // Validate event using debug endpoint in development
    if (process.env.NODE_ENV === 'development') {
      await this.debugEvent(payload);
    }
  }

  /**
   * Debug event using GA4 debug endpoint
   *
   * @param payload - GA4 measurement payload
   */
  private async debugEvent(
    payload: GA4MeasurementPayload,
  ): Promise<void> {
    const debugUrl = `https://www.google-analytics.com/debug/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;

    try {
      const response = await fetch(debugUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const debugResult = await response.json();

      if (debugResult.validationMessages?.length > 0) {
        this.logger.warn(
          `GA4 validation warnings: ${JSON.stringify(debugResult.validationMessages)}`,
        );
      }
    } catch (error) {
      this.logger.debug(`Debug event failed (non-critical): ${error.message}`);
    }
  }
}
