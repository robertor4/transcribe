import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  createMockUserRepository,
  createMockStripeClient,
  createMockStripeSubscription,
  createMockStripeCheckoutSession,
  createMockStripeInvoice,
  createMockStripeCustomer,
} from '../../test/mocks';
import {
  createTestUser,
  createProfessionalUser,
  createPaygUser,
} from '../../test/factories';
import Stripe from 'stripe';

describe('StripeService', () => {
  let service: StripeService;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockStripe: ReturnType<typeof createMockStripeClient>;
  let mockAnalyticsService: { trackPurchase: jest.Mock };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
        STRIPE_PRICE_PROFESSIONAL_MONTHLY: 'price_pro_monthly',
        STRIPE_PRICE_PROFESSIONAL_ANNUAL: 'price_pro_annual',
        STRIPE_PRICE_BUSINESS_MONTHLY: 'price_biz_monthly',
        STRIPE_PRICE_BUSINESS_ANNUAL: 'price_biz_annual',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    // Set up environment variables for price IDs
    process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY = 'price_pro_monthly';
    process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL = 'price_pro_annual';
    process.env.STRIPE_PRICE_BUSINESS_MONTHLY = 'price_biz_monthly';
    process.env.STRIPE_PRICE_BUSINESS_ANNUAL = 'price_biz_annual';

    mockUserRepository = createMockUserRepository();
    mockStripe = createMockStripeClient();
    mockAnalyticsService = {
      trackPurchase: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);

    // Replace internal Stripe client with mock
    (service as any).stripe = mockStripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer ID if user already has one', async () => {
      const user = createProfessionalUser({
        stripeCustomerId: 'cus_existing123',
      });
      mockUserRepository.getUserById.mockResolvedValue(user);

      const result = await service.getOrCreateCustomer(
        user.uid,
        user.email,
        user.displayName,
      );

      expect(result).toBe('cus_existing123');
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should create new Stripe customer if none exists', async () => {
      const user = createTestUser();
      mockUserRepository.getUserById.mockResolvedValue(user);
      mockStripe.customers.create.mockResolvedValue(
        createMockStripeCustomer({ id: 'cus_new123' }),
      );

      const result = await service.getOrCreateCustomer(
        user.uid,
        user.email,
        user.displayName,
      );

      expect(result).toBe('cus_new123');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: user.email,
        name: user.displayName,
        metadata: { userId: user.uid },
      });
    });

    it('should save new customer ID to user document', async () => {
      const user = createTestUser();
      mockUserRepository.getUserById.mockResolvedValue(user);
      mockStripe.customers.create.mockResolvedValue(
        createMockStripeCustomer({ id: 'cus_new123' }),
      );

      await service.getOrCreateCustomer(user.uid, user.email);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(user.uid, {
        stripeCustomerId: 'cus_new123',
        updatedAt: expect.any(Date),
      });
    });

    it('should handle user not found scenario', async () => {
      mockUserRepository.getUserById.mockResolvedValue(null);
      mockStripe.customers.create.mockResolvedValue(
        createMockStripeCustomer({ id: 'cus_new123' }),
      );

      const result = await service.getOrCreateCustomer(
        'unknown-user',
        'unknown@example.com',
      );

      expect(result).toBe('cus_new123');
      expect(mockStripe.customers.create).toHaveBeenCalled();
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for professional tier', async () => {
      const user = createTestUser();
      mockUserRepository.getUserById.mockResolvedValue(user);
      mockStripe.customers.create.mockResolvedValue(
        createMockStripeCustomer({ id: 'cus_test' }),
      );

      const session = createMockStripeCheckoutSession();
      mockStripe.checkout.sessions.create.mockResolvedValue(session);

      const result = await service.createCheckoutSession(
        user.uid,
        user.email,
        'professional',
        'monthly',
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(result.id).toBe(session.id);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          metadata: {
            userId: user.uid,
            tier: 'professional',
            billing: 'monthly',
          },
        }),
      );
    });

    it('should throw BadRequestException for invalid tier', async () => {
      const user = createTestUser();
      mockUserRepository.getUserById.mockResolvedValue(user);
      mockStripe.customers.create.mockResolvedValue(
        createMockStripeCustomer({ id: 'cus_test' }),
      );

      // Set price IDs to undefined for invalid tier
      (service as any).priceIds.invalid = undefined;

      await expect(
        service.createCheckoutSession(
          user.uid,
          user.email,
          'invalid' as any,
          'monthly',
          'https://example.com/success',
          'https://example.com/cancel',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create session with annual billing', async () => {
      const user = createTestUser();
      mockUserRepository.getUserById.mockResolvedValue(user);
      mockStripe.customers.create.mockResolvedValue(
        createMockStripeCustomer({ id: 'cus_test' }),
      );
      mockStripe.checkout.sessions.create.mockResolvedValue(
        createMockStripeCheckoutSession(),
      );

      await service.createCheckoutSession(
        user.uid,
        user.email,
        'professional',
        'annual',
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_pro_annual',
              quantity: 1,
            },
          ],
        }),
      );
    });
  });

  describe('createPaygCheckoutSession', () => {
    it('should create PAYG checkout session with correct metadata', async () => {
      const user = createTestUser();
      mockUserRepository.getUserById.mockResolvedValue(user);
      mockStripe.customers.create.mockResolvedValue(
        createMockStripeCustomer({ id: 'cus_test' }),
      );
      mockStripe.checkout.sessions.create.mockResolvedValue(
        createMockStripeCheckoutSession({ mode: 'payment' as any }),
      );

      await service.createPaygCheckoutSession(
        user.uid,
        user.email,
        1500, // $15 in cents
        10, // 10 hours
        'https://example.com/success',
        'https://example.com/cancel',
      );

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          metadata: {
            userId: user.uid,
            type: 'payg',
            hours: '10',
          },
        }),
      );
    });

    it('should create session with correct price data', async () => {
      const user = createTestUser();
      mockUserRepository.getUserById.mockResolvedValue(user);
      mockStripe.customers.create.mockResolvedValue(
        createMockStripeCustomer({ id: 'cus_test' }),
      );
      mockStripe.checkout.sessions.create.mockResolvedValue(
        createMockStripeCheckoutSession({ mode: 'payment' as any }),
      );

      await service.createPaygCheckoutSession(
        user.uid,
        user.email,
        2500, // $25 in cents
        20, // 20 hours
        'https://example.com/success',
        'https://example.com/cancel',
        undefined,
        'eur',
      );

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: 'Neural Summary Credits',
                  description: '20 hours of transcription credit',
                },
                unit_amount: 2500,
              },
              quantity: 1,
            },
          ],
        }),
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end', async () => {
      const subscription = createMockStripeSubscription();
      mockStripe.subscriptions.update.mockResolvedValue(subscription);

      await service.cancelSubscription('sub_test123', true);

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        { cancel_at_period_end: true },
      );
      expect(mockStripe.subscriptions.cancel).not.toHaveBeenCalled();
    });

    it('should cancel subscription immediately when requested', async () => {
      const subscription = createMockStripeSubscription();
      mockStripe.subscriptions.update.mockResolvedValue(subscription);
      mockStripe.subscriptions.cancel.mockResolvedValue({
        ...subscription,
        status: 'canceled',
      });

      await service.cancelSubscription('sub_test123', false);

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        { cancel_at_period_end: false },
      );
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith(
        'sub_test123',
      );
    });
  });

  describe('deleteCustomer', () => {
    it('should delete Stripe customer successfully', async () => {
      mockStripe.customers.del.mockResolvedValue({
        id: 'cus_test123',
        deleted: true,
      });

      await service.deleteCustomer('cus_test123');

      expect(mockStripe.customers.del).toHaveBeenCalledWith('cus_test123');
    });

    it('should handle customer not found gracefully', async () => {
      const error = new Error('Customer not found') as any;
      error.statusCode = 404;
      mockStripe.customers.del.mockRejectedValue(error);

      // Should not throw
      await expect(
        service.deleteCustomer('cus_nonexistent'),
      ).resolves.not.toThrow();
    });

    it('should rethrow non-404 errors', async () => {
      const error = new Error('Stripe API error') as any;
      error.statusCode = 500;
      mockStripe.customers.del.mockRejectedValue(error);

      await expect(service.deleteCustomer('cus_test123')).rejects.toThrow(
        'Stripe API error',
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription with new price', async () => {
      const subscription = createMockStripeSubscription();
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.subscriptions.update.mockResolvedValue(subscription);

      await service.updateSubscription('sub_test123', 'price_new123');

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_test123',
        {
          items: [
            {
              id: 'si_test123',
              price: 'price_new123',
            },
          ],
          proration_behavior: 'always_invoice',
        },
      );
    });
  });

  describe('createOverageCharge', () => {
    it('should create invoice item for overage', async () => {
      mockStripe.invoiceItems.create.mockResolvedValue({ id: 'ii_test123' });

      await service.createOverageCharge('cus_test123', 5.5, 275); // 5.5 hours, $2.75

      expect(mockStripe.invoiceItems.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        amount: 275,
        currency: 'usd',
        description: 'Overage: 5.50 hours @ $0.50/hour',
        metadata: {
          type: 'overage',
          hours: '5.5',
        },
      });
    });
  });

  describe('constructWebhookEvent', () => {
    it('should throw if webhook secret is not configured', async () => {
      const configServiceWithoutSecret = {
        get: jest.fn().mockReturnValue(undefined),
      };
      (service as any).configService = configServiceWithoutSecret;

      expect(() => {
        service.constructWebhookEvent(Buffer.from(''), 'sig');
      }).toThrow('STRIPE_WEBHOOK_SECRET is not configured');
    });

    it('should throw BadRequestException on invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      expect(() => {
        service.constructWebhookEvent(Buffer.from('payload'), 'invalid_sig');
      }).toThrow(BadRequestException);
    });
  });

  describe('handleCheckoutSessionCompleted', () => {
    it('should upgrade user to professional tier on subscription checkout', async () => {
      const session = createMockStripeCheckoutSession({
        mode: 'subscription' as any,
        metadata: {
          userId: 'test-user-123',
          tier: 'professional',
          billing: 'monthly',
        },
      });
      const subscription = createMockStripeSubscription();
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);

      await service.handleCheckoutSessionCompleted(session);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          subscriptionTier: 'professional',
          stripeSubscriptionId: 'sub_test123',
          subscriptionStatus: 'active',
          usageThisMonth: expect.objectContaining({
            hours: 0,
            transcriptions: 0,
            onDemandAnalyses: 0,
          }),
        }),
      );
    });

    it('should reset user usage on subscription upgrade', async () => {
      const session = createMockStripeCheckoutSession({
        mode: 'subscription' as any,
        metadata: {
          userId: 'test-user-123',
          tier: 'professional',
          billing: 'monthly',
        },
      });
      mockStripe.subscriptions.retrieve.mockResolvedValue(
        createMockStripeSubscription(),
      );

      await service.handleCheckoutSessionCompleted(session);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          usageThisMonth: {
            hours: 0,
            transcriptions: 0,
            onDemandAnalyses: 0,
            lastResetAt: expect.any(Date),
          },
        }),
      );
    });

    it('should track purchase analytics on successful checkout', async () => {
      const session = createMockStripeCheckoutSession({
        mode: 'subscription' as any,
        amount_total: 2900,
        currency: 'usd',
        metadata: {
          userId: 'test-user-123',
          tier: 'professional',
          billing: 'monthly',
        },
      });
      mockStripe.subscriptions.retrieve.mockResolvedValue(
        createMockStripeSubscription(),
      );

      await service.handleCheckoutSessionCompleted(session);

      expect(mockAnalyticsService.trackPurchase).toHaveBeenCalledWith(
        'test-user-123',
        session.id,
        29, // $29.00
        'USD',
        'professional',
        'monthly',
      );
    });

    it('should add PAYG credits on one-time payment', async () => {
      const user = createPaygUser(5);
      mockUserRepository.getUserById.mockResolvedValue(user);

      const session = createMockStripeCheckoutSession({
        mode: 'payment' as any,
        amount_total: 1500,
        metadata: {
          userId: user.uid,
          type: 'payg',
          hours: '10',
        },
      });

      await service.handleCheckoutSessionCompleted(session);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        user.uid,
        expect.objectContaining({
          subscriptionTier: 'payg',
          paygCredits: 15, // 5 existing + 10 new
        }),
      );
    });

    it('should handle missing userId in metadata gracefully', async () => {
      const session = createMockStripeCheckoutSession({
        metadata: {}, // No userId
      });

      // Should not throw, just return early
      await expect(
        service.handleCheckoutSessionCompleted(session),
      ).resolves.not.toThrow();
      expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionUpdated', () => {
    it('should update subscription status to active', async () => {
      const subscription = createMockStripeSubscription({
        status: 'active',
        metadata: { userId: 'test-user-123' },
      });

      await service.handleSubscriptionUpdated(subscription);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          subscriptionStatus: 'active',
        }),
      );
    });

    it('should downgrade to free on canceled status', async () => {
      const subscription = createMockStripeSubscription({
        status: 'canceled',
        metadata: { userId: 'test-user-123' },
      });

      await service.handleSubscriptionUpdated(subscription);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          subscriptionTier: 'free',
          stripeSubscriptionId: null,
        }),
      );
    });

    it('should downgrade to free on unpaid status', async () => {
      const subscription = createMockStripeSubscription({
        status: 'unpaid',
        metadata: { userId: 'test-user-123' },
      });

      await service.handleSubscriptionUpdated(subscription);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          subscriptionTier: 'free',
        }),
      );
    });

    it('should handle missing userId gracefully', async () => {
      const subscription = createMockStripeSubscription({
        metadata: {},
      });

      await expect(
        service.handleSubscriptionUpdated(subscription),
      ).resolves.not.toThrow();
      expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionDeleted', () => {
    it('should downgrade user to free tier', async () => {
      const subscription = createMockStripeSubscription({
        metadata: { userId: 'test-user-123' },
      });

      await service.handleSubscriptionDeleted(subscription);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          subscriptionTier: 'free',
          subscriptionStatus: undefined,
          stripeSubscriptionId: undefined,
        }),
      );
    });

    it('should clear Stripe subscription ID', async () => {
      const subscription = createMockStripeSubscription({
        metadata: { userId: 'test-user-123' },
      });

      await service.handleSubscriptionDeleted(subscription);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'test-user-123',
        expect.objectContaining({
          stripeSubscriptionId: undefined,
          currentPeriodStart: undefined,
          currentPeriodEnd: undefined,
        }),
      );
    });
  });

  describe('handleInvoicePaymentSucceeded', () => {
    it('should reset usage on subscription_cycle billing reason', async () => {
      const user = createProfessionalUser();
      mockUserRepository.getUserByStripeCustomerId.mockResolvedValue(user);

      const invoice = createMockStripeInvoice({
        billing_reason: 'subscription_cycle',
      });

      await service.handleInvoicePaymentSucceeded(invoice);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        user.uid,
        expect.objectContaining({
          usageThisMonth: {
            hours: 0,
            transcriptions: 0,
            onDemandAnalyses: 0,
            lastResetAt: expect.any(Date),
          },
        }),
      );
    });

    it('should not reset usage for initial subscription invoice', async () => {
      const user = createProfessionalUser();
      mockUserRepository.getUserByStripeCustomerId.mockResolvedValue(user);

      const invoice = createMockStripeInvoice({
        billing_reason: 'subscription_create',
      });

      await service.handleInvoicePaymentSucceeded(invoice);

      expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
    });

    it('should handle unknown customer ID', async () => {
      mockUserRepository.getUserByStripeCustomerId.mockResolvedValue(null);

      const invoice = createMockStripeInvoice();

      await expect(
        service.handleInvoicePaymentSucceeded(invoice),
      ).resolves.not.toThrow();
      expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentFailed', () => {
    it('should update subscription status to past_due', async () => {
      const user = createProfessionalUser();
      mockUserRepository.getUserByStripeCustomerId.mockResolvedValue(user);

      const invoice = createMockStripeInvoice({ status: 'open' as any });

      await service.handleInvoicePaymentFailed(invoice);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(user.uid, {
        subscriptionStatus: 'past_due',
        updatedAt: expect.any(Date),
      });
    });

    it('should handle user not found', async () => {
      mockUserRepository.getUserByStripeCustomerId.mockResolvedValue(null);

      const invoice = createMockStripeInvoice();

      await expect(
        service.handleInvoicePaymentFailed(invoice),
      ).resolves.not.toThrow();
      expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('getSubscription', () => {
    it('should retrieve subscription by ID', async () => {
      const subscription = createMockStripeSubscription();
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);

      const result = await service.getSubscription('sub_test123');

      expect(result).toEqual(subscription);
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith(
        'sub_test123',
      );
    });
  });

  describe('getBillingHistory', () => {
    it('should retrieve billing history for customer', async () => {
      const invoices = [createMockStripeInvoice(), createMockStripeInvoice()];
      mockStripe.invoices.list.mockResolvedValue({ data: invoices });

      const result = await service.getBillingHistory('cus_test123');

      expect(result).toEqual(invoices);
      expect(mockStripe.invoices.list).toHaveBeenCalledWith({
        customer: 'cus_test123',
        limit: 12,
      });
    });

    it('should use custom limit', async () => {
      mockStripe.invoices.list.mockResolvedValue({ data: [] });

      await service.getBillingHistory('cus_test123', 5);

      expect(mockStripe.invoices.list).toHaveBeenCalledWith({
        customer: 'cus_test123',
        limit: 5,
      });
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return list of supported currencies', () => {
      const currencies = service.getSupportedCurrencies();

      expect(currencies).toContainEqual({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      });
      expect(currencies).toContainEqual({
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
      });
      expect(currencies.length).toBeGreaterThan(10);
    });
  });
});
