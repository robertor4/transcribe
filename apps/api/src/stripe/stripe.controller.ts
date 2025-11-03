import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePaygSessionDto } from './dto/create-payg-session.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ConfigService } from '@nestjs/config';

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  /**
   * Create Stripe Checkout session for subscription
   */
  @Post('create-checkout-session')
  @UseGuards(FirebaseAuthGuard)
  async createCheckoutSession(
    @Req() req: any,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    const user = req.user;
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const successUrl =
      dto.successUrl ||
      `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/pricing`;

    try {
      // Get full user record from Firestore to include displayName
      const userData = await this.stripeService['firebaseService'].getUser(
        user.uid,
      );

      const session = await this.stripeService.createCheckoutSession(
        user.uid,
        user.email,
        dto.tier,
        dto.billing || 'monthly',
        successUrl,
        cancelUrl,
        dto.locale,
        dto.currency,
        userData?.displayName,
      );

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  /**
   * Create Stripe Checkout session for PAYG credits
   */
  @Post('create-payg-session')
  @UseGuards(FirebaseAuthGuard)
  async createPaygSession(@Req() req: any, @Body() dto: CreatePaygSessionDto) {
    const user = req.user;
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const successUrl =
      dto.successUrl ||
      `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/pricing`;

    // Validate minimum purchase
    if (dto.amount < 15 || dto.hours < 10) {
      throw new BadRequestException('Minimum purchase is $15 for 10 hours');
    }

    try {
      // Get full user record from Firestore to include displayName
      const userData = await this.stripeService['firebaseService'].getUser(
        user.uid,
      );

      const session = await this.stripeService.createPaygCheckoutSession(
        user.uid,
        user.email,
        dto.amount * 100, // Convert to cents
        dto.hours,
        successUrl,
        cancelUrl,
        dto.locale,
        dto.currency,
        userData?.displayName,
      );

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create PAYG session: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to create PAYG checkout session');
    }
  }

  /**
   * Cancel user's subscription
   */
  @Post('cancel-subscription')
  @UseGuards(FirebaseAuthGuard)
  async cancelSubscription(@Req() req: any) {
    const user = req.user;

    // Get user's subscription ID from Firestore
    const userData = await this.stripeService['firebaseService'].getUser(
      user.uid,
    );
    if (!userData?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    try {
      const subscription = await this.stripeService.cancelSubscription(
        userData.stripeSubscriptionId,
        true, // Cancel at period end
      );

      return {
        success: true,
        message:
          'Subscription will be cancelled at the end of the billing period',
        cancelAt: subscription.cancel_at,
      };
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  @Post('update-subscription')
  @UseGuards(FirebaseAuthGuard)
  async updateSubscription(
    @Req() req: any,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    const user = req.user;

    // Get user's subscription ID from Firebase
    const userData = await this.stripeService['firebaseService'].getUser(
      user.uid,
    );
    if (!userData?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription found');
    }

    // Get new price ID based on tier and billing
    const tier = dto.newTier || userData.subscriptionTier;
    const billing = dto.newBilling || 'monthly';
    const newPriceId = this.stripeService['priceIds'][tier]?.[billing];

    if (!newPriceId) {
      throw new BadRequestException('Invalid tier or billing period');
    }

    try {
      const subscription = await this.stripeService.updateSubscription(
        userData.stripeSubscriptionId,
        newPriceId,
      );

      return {
        success: true,
        message: 'Subscription updated successfully',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: (subscription as any).current_period_end,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to update subscription: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to update subscription');
    }
  }

  /**
   * Get current subscription details
   */
  @Get('subscription')
  @UseGuards(FirebaseAuthGuard)
  async getSubscription(@Req() req: any) {
    const user = req.user;

    const userData = await this.stripeService['firebaseService'].getUser(
      user.uid,
    );
    if (!userData?.stripeSubscriptionId) {
      return {
        success: true,
        subscription: null,
        tier: userData?.subscriptionTier || 'free',
      };
    }

    try {
      const subscription = await this.stripeService.getSubscription(
        userData.stripeSubscriptionId,
      );

      // Extract current period dates from subscription items
      // In modern Stripe subscriptions, these are in items.data[0]
      const firstItem = subscription.items?.data?.[0];
      const currentPeriodStart =
        firstItem?.current_period_start ||
        subscription.start_date ||
        subscription.created;
      const currentPeriodEnd =
        firstItem?.current_period_end || subscription.billing_cycle_anchor;

      this.logger.log(
        `Subscription ${subscription.id}: Period ${new Date(currentPeriodStart * 1000).toISOString()} - ${new Date(currentPeriodEnd * 1000).toISOString()}`,
      );

      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          cancelAt: subscription.cancel_at,
        },
        tier: userData.subscriptionTier,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch subscription from Stripe (ID: ${userData.stripeSubscriptionId}): ${error.message}. This may be a test subscription with live keys, or a deleted subscription.`,
      );
      // Return fallback data with tier info from Firestore
      return {
        success: true,
        subscription: null,
        tier: userData.subscriptionTier || 'free',
        warning: 'Subscription details unavailable from Stripe',
      };
    }
  }

  /**
   * Get billing history
   */
  @Get('billing-history')
  @UseGuards(FirebaseAuthGuard)
  async getBillingHistory(@Req() req: any) {
    const user = req.user;

    const userData = await this.stripeService['firebaseService'].getUser(
      user.uid,
    );
    if (!userData?.stripeCustomerId) {
      return {
        success: true,
        invoices: [],
      };
    }

    try {
      const invoices = await this.stripeService.getBillingHistory(
        userData.stripeCustomerId,
        12,
      );

      return {
        success: true,
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          created: invoice.created,
          invoicePdf: invoice.invoice_pdf,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
        })),
      };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch billing history from Stripe (Customer ID: ${userData.stripeCustomerId}): ${error.message}. This may be a test customer with live keys, or a deleted customer.`,
      );
      // Return empty billing history instead of throwing error
      return {
        success: true,
        invoices: [],
        warning: 'Billing history unavailable from Stripe',
      };
    }
  }

  /**
   * Get supported currencies for multi-currency pricing
   */
  @Get('currencies')
  async getSupportedCurrencies() {
    const currencies = await this.stripeService.getSupportedCurrencies();
    return {
      success: true,
      currencies,
    };
  }

  /**
   * Stripe webhook endpoint
   * IMPORTANT: This endpoint must NOT use body parsing middleware
   * The raw body is needed for signature verification
   */
  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      this.logger.error('Missing raw body for webhook verification');
      throw new BadRequestException('Missing raw body');
    }

    try {
      // Verify webhook signature and construct event
      const event = await this.stripeService.constructWebhookEvent(
        req.rawBody,
        signature,
      );

      this.logger.log(`Received webhook event: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.stripeService.handleCheckoutSessionCompleted(
            event.data.object as any,
          );
          break;

        case 'customer.subscription.updated':
          await this.stripeService.handleSubscriptionUpdated(
            event.data.object as any,
          );
          break;

        case 'customer.subscription.deleted':
          await this.stripeService.handleSubscriptionDeleted(
            event.data.object as any,
          );
          break;

        case 'invoice.payment_succeeded':
          await this.stripeService.handleInvoicePaymentSucceeded(
            event.data.object as any,
          );
          break;

        case 'invoice.payment_failed':
          await this.stripeService.handleInvoicePaymentFailed(
            event.data.object as any,
          );
          break;

        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`, error.stack);
      throw new BadRequestException('Webhook processing failed');
    }
  }
}
