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
  RawBodyRequest,
} from '@nestjs/common';
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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const successUrl = dto.successUrl || `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/pricing`;

    try {
      const session = await this.stripeService.createCheckoutSession(
        user.uid,
        user.email,
        dto.tier,
        dto.billing || 'monthly',
        successUrl,
        cancelUrl,
        dto.locale,
        dto.currency,
      );

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  /**
   * Create Stripe Checkout session for PAYG credits
   */
  @Post('create-payg-session')
  @UseGuards(FirebaseAuthGuard)
  async createPaygSession(
    @Req() req: any,
    @Body() dto: CreatePaygSessionDto,
  ) {
    const user = req.user;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    const successUrl = dto.successUrl || `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/pricing`;

    // Validate minimum purchase
    if (dto.amount < 15 || dto.hours < 10) {
      throw new BadRequestException('Minimum purchase is $15 for 10 hours');
    }

    try {
      const session = await this.stripeService.createPaygCheckoutSession(
        user.uid,
        user.email,
        dto.amount * 100, // Convert to cents
        dto.hours,
        successUrl,
        cancelUrl,
        dto.locale,
        dto.currency,
      );

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create PAYG session: ${error.message}`, error.stack);
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

    // Get user's subscription ID from Firebase
    const userData = await this.stripeService['firebaseService'].getUserById(user.uid);
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
        message: 'Subscription will be cancelled at the end of the billing period',
        cancelAt: subscription.cancel_at,
      };
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`, error.stack);
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
    const userData = await this.stripeService['firebaseService'].getUserById(user.uid);
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
          currentPeriodEnd: subscription.current_period_end,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`, error.stack);
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

    const userData = await this.stripeService['firebaseService'].getUserById(user.uid);
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

      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          cancelAt: subscription.cancel_at,
        },
        tier: userData.subscriptionTier,
      };
    } catch (error) {
      this.logger.error(`Failed to get subscription: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get subscription details');
    }
  }

  /**
   * Get billing history
   */
  @Get('billing-history')
  @UseGuards(FirebaseAuthGuard)
  async getBillingHistory(@Req() req: any) {
    const user = req.user;

    const userData = await this.stripeService['firebaseService'].getUserById(user.uid);
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
      this.logger.error(`Failed to get billing history: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get billing history');
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
