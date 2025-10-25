import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  // Price IDs for different tiers and billing periods
  private priceIds = {
    professional: {
      monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
      annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
    },
    business: {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
      annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL,
    },
  };

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(apiKey);

    this.logger.log('Stripe service initialized');
  }

  /**
   * Get or create Stripe customer for a user
   */
  async getOrCreateCustomer(
    userId: string,
    email: string,
    name?: string,
  ): Promise<string> {
    // Check if user already has a Stripe customer ID
    const user = await this.firebaseService.getUserById(userId);
    if (user?.stripeCustomerId) {
      this.logger.log(`User ${userId} already has Stripe customer: ${user.stripeCustomerId}`);
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    this.logger.log(`Creating new Stripe customer for user ${userId}`);
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    // Save customer ID to user document
    await this.firebaseService.updateUser(userId, {
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    });

    this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);
    return customer.id;
  }

  /**
   * Create Stripe Checkout session for subscription
   * Supports multi-currency with automatic conversion
   */
  async createCheckoutSession(
    userId: string,
    email: string,
    tier: 'professional' | 'business' | 'enterprise',
    billing: 'monthly' | 'annual' = 'monthly',
    successUrl: string,
    cancelUrl: string,
    locale?: string,
    currency?: string,
  ): Promise<Stripe.Checkout.Session> {
    this.logger.log(
      `Creating checkout session for user ${userId}, tier: ${tier}, billing: ${billing}, currency: ${currency || 'auto'}`,
    );

    // Get or create customer
    const customerId = await this.getOrCreateCustomer(userId, email);

    // Get price ID for tier and billing period
    const priceId = this.priceIds[tier]?.[billing];
    if (!priceId) {
      throw new BadRequestException(`Invalid tier or billing period: ${tier}/${billing}`);
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: (locale as Stripe.Checkout.SessionCreateParams.Locale) || 'auto', // auto-detect
      // Multi-currency handled automatically by Stripe Adaptive Pricing (configured in Dashboard)
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
      automatic_tax: {
        enabled: true, // Stripe Tax for automatic VAT/sales tax
      },
      customer_update: {
        address: 'auto', // Save address entered in checkout to customer
      },
      metadata: {
        userId,
        tier,
        billing,
      },
      subscription_data: {
        metadata: {
          userId,
          tier,
        },
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
      },
    });

    this.logger.log(`Created checkout session: ${session.id}`);
    return session;
  }

  /**
   * Create Stripe Checkout session for PAYG credits (one-time payment)
   */
  async createPaygCheckoutSession(
    userId: string,
    email: string,
    amount: number, // Amount in USD cents
    hours: number,
    successUrl: string,
    cancelUrl: string,
    locale?: string,
    currency?: string,
  ): Promise<Stripe.Checkout.Session> {
    this.logger.log(
      `Creating PAYG checkout for user ${userId}, amount: $${amount / 100}, hours: ${hours}, currency: ${currency || 'auto'}`,
    );

    // Get or create customer
    const customerId = await this.getOrCreateCustomer(userId, email);

    // Create checkout session for one-time payment
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency || 'usd',
            product_data: {
              name: 'Neural Summary Credits',
              description: `${hours} hours of transcription credit`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: (locale as Stripe.Checkout.SessionCreateParams.Locale) || 'auto',
      automatic_tax: {
        enabled: true,
      },
      customer_update: {
        address: 'auto', // Save address entered in checkout to customer
      },
      metadata: {
        userId,
        type: 'payg',
        hours: hours.toString(),
      },
    });

    this.logger.log(`Created PAYG checkout session: ${session.id}`);
    return session;
  }

  /**
   * Cancel subscription (at period end or immediately)
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<Stripe.Subscription> {
    this.logger.log(
      `Cancelling subscription ${subscriptionId}, at period end: ${cancelAtPeriodEnd}`,
    );

    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    if (!cancelAtPeriodEnd) {
      await this.stripe.subscriptions.cancel(subscriptionId);
    }

    return subscription;
  }

  /**
   * Update subscription (upgrade/downgrade)
   *
   * TODO: Implement proper downgrade logic (Phase 2)
   * - Upgrades: Immediate with prorated charge (current behavior is correct)
   * - Downgrades: Schedule for end of billing period (not implemented yet)
   * For now, both upgrades and downgrades happen immediately with prorations.
   * See: https://stripe.com/docs/billing/subscriptions/upgrade-downgrade
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    this.logger.log(`Updating subscription ${subscriptionId} to price ${newPriceId}`);

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const currentItem = subscription.items.data[0];

    // TODO: Detect if this is an upgrade or downgrade by comparing prices
    // If downgrade, use proration_behavior: 'none' and set proration_date to period end

    const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice', // Pro-rate immediately (both upgrades and downgrades for now)
    });

    return updatedSubscription;
  }

  /**
   * Create invoice item for overage charges
   */
  async createOverageCharge(
    customerId: string,
    hours: number,
    amount: number, // in cents
  ): Promise<Stripe.InvoiceItem> {
    this.logger.log(`Creating overage charge for customer ${customerId}: ${hours} hours, $${amount / 100}`);

    const invoiceItem = await this.stripe.invoiceItems.create({
      customer: customerId,
      amount,
      currency: 'usd',
      description: `Overage: ${hours.toFixed(2)} hours @ $0.50/hour`,
      metadata: {
        type: 'overage',
        hours: hours.toString(),
      },
    });

    return invoiceItem;
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Get customer billing history
   */
  async getBillingHistory(
    customerId: string,
    limit: number = 12,
  ): Promise<Stripe.Invoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data;
  }

  /**
   * Construct webhook event from raw body and signature
   */
  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Handle checkout.session.completed webhook
   */
  async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error('Checkout session missing userId in metadata');
      return;
    }

    this.logger.log(`Processing checkout completion for user ${userId}`);

    // Check if it's a subscription or PAYG
    if (session.mode === 'subscription') {
      const subscriptionId = session.subscription as string;
      const tier = session.metadata?.tier as 'professional' | 'business';

      // Update user with subscription info and reset usage
      await this.firebaseService.updateUser(userId, {
        subscriptionTier: tier,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        usageThisMonth: {
          hours: 0,
          transcriptions: 0,
          onDemandAnalyses: 0,
          lastResetAt: new Date(),
        },
        updatedAt: new Date(),
      });

      this.logger.log(`User ${userId} upgraded to ${tier} - usage reset`);
    } else if (session.mode === 'payment' && session.metadata?.type === 'payg') {
      // Add PAYG credits
      const hours = parseInt(session.metadata.hours || '0', 10);
      const user = await this.firebaseService.getUserById(userId);
      const currentCredits = user?.paygCredits || 0;

      await this.firebaseService.updateUser(userId, {
        subscriptionTier: 'payg',
        paygCredits: currentCredits + hours,
        updatedAt: new Date(),
      });

      this.logger.log(`Added ${hours} PAYG credits to user ${userId}`);
    }
  }

  /**
   * Handle customer.subscription.updated webhook
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      this.logger.error('Subscription missing userId in metadata');
      return;
    }

    this.logger.log(`Processing subscription update for user ${userId}: ${subscription.status}`);

    const updates: any = {
      subscriptionStatus: subscription.status as any,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      updatedAt: new Date(),
    };

    // If subscription is cancelled/ended, downgrade to free
    if (
      subscription.status === 'canceled' ||
      subscription.status === 'unpaid' ||
      subscription.status === 'incomplete_expired'
    ) {
      updates.subscriptionTier = 'free';
      updates.stripeSubscriptionId = null;
      this.logger.log(`User ${userId} downgraded to free tier`);
    }

    await this.firebaseService.updateUser(userId, updates);
  }

  /**
   * Handle customer.subscription.deleted webhook
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      this.logger.error('Subscription missing userId in metadata');
      return;
    }

    this.logger.log(`Processing subscription deletion for user ${userId}`);

    // Downgrade to free tier
    await this.firebaseService.updateUser(userId, {
      subscriptionTier: 'free',
      subscriptionStatus: undefined,
      stripeSubscriptionId: undefined,
      currentPeriodStart: undefined,
      currentPeriodEnd: undefined,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    });

    this.logger.log(`User ${userId} subscription deleted, downgraded to free`);
  }

  /**
   * Handle invoice.payment_succeeded webhook
   */
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    this.logger.log(`Payment succeeded for customer ${customerId}, invoice: ${invoice.id}`);

    // Find user by customer ID
    const user = await this.firebaseService.getUserByStripeCustomerId(customerId);
    if (!user) {
      this.logger.warn(`No user found for customer ${customerId}`);
      return;
    }

    // Reset usage if this is the start of a new billing period
    if (invoice.billing_reason === 'subscription_cycle') {
      await this.firebaseService.updateUser(user.uid, {
        usageThisMonth: {
          hours: 0,
          transcriptions: 0,
          onDemandAnalyses: 0,
          lastResetAt: new Date(),
        },
        updatedAt: new Date(),
      });

      this.logger.log(`Reset monthly usage for user ${user.uid} (new billing cycle)`);
    }
  }

  /**
   * Handle invoice.payment_failed webhook
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;
    this.logger.error(`Payment failed for customer ${customerId}, invoice: ${invoice.id}`);

    // Find user by customer ID
    const user = await this.firebaseService.getUserByStripeCustomerId(customerId);
    if (!user) {
      this.logger.warn(`No user found for customer ${customerId}`);
      return;
    }

    // Update subscription status
    await this.firebaseService.updateUser(user.uid, {
      subscriptionStatus: 'past_due',
      updatedAt: new Date(),
    });

    // TODO: Send email notification to user about failed payment
    this.logger.log(`Updated user ${user.uid} status to past_due`);
  }

  /**
   * Get supported currencies with their conversion rates
   * Used for displaying pricing in multiple currencies
   */
  async getSupportedCurrencies(): Promise<Array<{ code: string; name: string; symbol: string }>> {
    return [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
      { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
      { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
      { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
      { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
      { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
      { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
      { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
      { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
    ];
  }
}
