import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import {
  createMockStripeCheckoutSession,
  createMockStripeSubscription,
  createMockStripeInvoice,
  createMockStripeEvent,
} from '../../test/mocks';
import { createProfessionalUser, createTestUser } from '../../test/factories';
import Stripe from 'stripe';

// Mock FirebaseAuthGuard to bypass authentication
const mockAuthGuard: CanActivate = {
  canActivate: (context: ExecutionContext) => {
    return true;
  },
};

describe('StripeController', () => {
  let controller: StripeController;
  let mockStripeService: any;
  let mockFirebaseService: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'FRONTEND_URL') return 'https://app.example.com';
      return null;
    }),
  };

  beforeEach(async () => {
    mockFirebaseService = {
      getUser: jest.fn().mockResolvedValue(null),
    };

    mockStripeService = {
      createCheckoutSession: jest
        .fn()
        .mockResolvedValue(createMockStripeCheckoutSession()),
      createPaygCheckoutSession: jest
        .fn()
        .mockResolvedValue(
          createMockStripeCheckoutSession({ mode: 'payment' as any }),
        ),
      cancelSubscription: jest
        .fn()
        .mockResolvedValue(createMockStripeSubscription()),
      updateSubscription: jest
        .fn()
        .mockResolvedValue(createMockStripeSubscription()),
      getSubscription: jest
        .fn()
        .mockResolvedValue(createMockStripeSubscription()),
      getBillingHistory: jest.fn().mockResolvedValue([]),
      getSupportedCurrencies: jest.fn().mockReturnValue([
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
      ]),
      constructWebhookEvent: jest.fn(),
      handleCheckoutSessionCompleted: jest.fn().mockResolvedValue(undefined),
      handleSubscriptionUpdated: jest.fn().mockResolvedValue(undefined),
      handleSubscriptionDeleted: jest.fn().mockResolvedValue(undefined),
      handleInvoicePaymentSucceeded: jest.fn().mockResolvedValue(undefined),
      handleInvoicePaymentFailed: jest.fn().mockResolvedValue(undefined),
      firebaseService: mockFirebaseService,
      priceIds: {
        professional: {
          monthly: 'price_pro_monthly',
          annual: 'price_pro_annual',
        },
        business: {
          monthly: 'price_biz_monthly',
          annual: 'price_biz_annual',
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        { provide: StripeService, useValue: mockStripeService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<StripeController>(StripeController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /stripe/create-checkout-session', () => {
    it('should create checkout session for authenticated user', async () => {
      const user = createTestUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      const result = await controller.createCheckoutSession(
        { user: { uid: user.uid, email: user.email } },
        { tier: 'professional', billing: 'monthly' },
      );

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.url).toBeDefined();
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        user.uid,
        user.email,
        'professional',
        'monthly',
        expect.any(String),
        expect.any(String),
        undefined,
        undefined,
        user.displayName,
      );
    });

    it('should use custom success and cancel URLs', async () => {
      const user = createTestUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      await controller.createCheckoutSession(
        { user: { uid: user.uid, email: user.email } },
        {
          tier: 'professional',
          successUrl: 'https://custom.com/success',
          cancelUrl: 'https://custom.com/cancel',
        },
      );

      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        user.uid,
        user.email,
        'professional',
        'monthly',
        'https://custom.com/success',
        'https://custom.com/cancel',
        undefined,
        undefined,
        user.displayName,
      );
    });

    it('should throw BadRequestException on service error', async () => {
      const user = createTestUser();
      mockFirebaseService.getUser.mockResolvedValue(user);
      mockStripeService.createCheckoutSession.mockRejectedValue(
        new Error('Stripe error'),
      );

      await expect(
        controller.createCheckoutSession(
          { user: { uid: user.uid, email: user.email } },
          { tier: 'professional' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /stripe/create-payg-session', () => {
    it('should create PAYG session with valid amount and hours', async () => {
      const user = createTestUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      const result = await controller.createPaygSession(
        { user: { uid: user.uid, email: user.email } },
        { amount: 15, hours: 10 },
      );

      expect(result.success).toBe(true);
      expect(mockStripeService.createPaygCheckoutSession).toHaveBeenCalledWith(
        user.uid,
        user.email,
        1500, // $15 in cents
        10,
        expect.any(String),
        expect.any(String),
        undefined,
        undefined,
        user.displayName,
      );
    });

    it('should reject amount below $15 minimum', async () => {
      const user = createTestUser();

      await expect(
        controller.createPaygSession(
          { user: { uid: user.uid, email: user.email } },
          { amount: 10, hours: 10 },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject hours below 10 minimum', async () => {
      const user = createTestUser();

      await expect(
        controller.createPaygSession(
          { user: { uid: user.uid, email: user.email } },
          { amount: 15, hours: 5 },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /stripe/cancel-subscription', () => {
    it('should cancel subscription at period end', async () => {
      const user = createProfessionalUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      const result = await controller.cancelSubscription({
        user: { uid: user.uid },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('cancelled at the end');
      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith(
        user.stripeSubscriptionId,
        true,
      );
    });

    it('should throw if user has no active subscription', async () => {
      const user = createTestUser(); // No subscription
      mockFirebaseService.getUser.mockResolvedValue(user);

      await expect(
        controller.cancelSubscription({ user: { uid: user.uid } }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /stripe/update-subscription', () => {
    it('should update subscription with new tier', async () => {
      const user = createProfessionalUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      const result = await controller.updateSubscription(
        { user: { uid: user.uid } },
        { newTier: 'business', newBilling: 'annual' },
      );

      expect(result.success).toBe(true);
      expect(mockStripeService.updateSubscription).toHaveBeenCalledWith(
        user.stripeSubscriptionId,
        'price_biz_annual',
      );
    });

    it('should throw if user has no subscription', async () => {
      const user = createTestUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      await expect(
        controller.updateSubscription(
          { user: { uid: user.uid } },
          { newTier: 'business' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for invalid tier', async () => {
      const user = createProfessionalUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      await expect(
        controller.updateSubscription(
          { user: { uid: user.uid } },
          { newTier: 'invalid' as any },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /stripe/subscription', () => {
    it('should return subscription details', async () => {
      const user = createProfessionalUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      const result = await controller.getSubscription({
        user: { uid: user.uid },
      });

      expect(result.success).toBe(true);
      expect(result.subscription).toBeDefined();
      expect(result.tier).toBe('professional');
    });

    it('should return null subscription for free tier', async () => {
      const user = createTestUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      const result = await controller.getSubscription({
        user: { uid: user.uid },
      });

      expect(result.success).toBe(true);
      expect(result.subscription).toBeNull();
      expect(result.tier).toBe('free');
    });
  });

  describe('GET /stripe/billing-history', () => {
    it('should return billing history', async () => {
      const user = createProfessionalUser();
      mockFirebaseService.getUser.mockResolvedValue(user);
      mockStripeService.getBillingHistory.mockResolvedValue([
        createMockStripeInvoice(),
      ]);

      const result = await controller.getBillingHistory({
        user: { uid: user.uid },
      });

      expect(result.success).toBe(true);
      expect(result.invoices).toHaveLength(1);
    });

    it('should return empty array if no customer ID', async () => {
      const user = createTestUser();
      mockFirebaseService.getUser.mockResolvedValue(user);

      const result = await controller.getBillingHistory({
        user: { uid: user.uid },
      });

      expect(result.success).toBe(true);
      expect(result.invoices).toEqual([]);
    });
  });

  describe('GET /stripe/currencies', () => {
    it('should return supported currencies', () => {
      const result = controller.getSupportedCurrencies();

      expect(result.success).toBe(true);
      expect(result.currencies).toContainEqual({
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
      });
    });
  });

  describe('POST /stripe/webhook', () => {
    it('should reject missing stripe-signature header', async () => {
      await expect(
        controller.handleWebhook('', { rawBody: Buffer.from('') } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject missing rawBody', async () => {
      await expect(
        controller.handleWebhook('sig_test', {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process checkout.session.completed event', async () => {
      const session = createMockStripeCheckoutSession();
      const event = createMockStripeEvent(
        'checkout.session.completed',
        session,
      );
      mockStripeService.constructWebhookEvent.mockReturnValue(event);

      const result = await controller.handleWebhook('sig_test', {
        rawBody: Buffer.from('payload'),
      } as any);

      expect(result).toEqual({ received: true });
      expect(
        mockStripeService.handleCheckoutSessionCompleted,
      ).toHaveBeenCalled();
    });

    it('should process customer.subscription.updated event', async () => {
      const subscription = createMockStripeSubscription();
      const event = createMockStripeEvent(
        'customer.subscription.updated',
        subscription,
      );
      mockStripeService.constructWebhookEvent.mockReturnValue(event);

      await controller.handleWebhook('sig_test', {
        rawBody: Buffer.from('payload'),
      } as any);

      expect(mockStripeService.handleSubscriptionUpdated).toHaveBeenCalled();
    });

    it('should process customer.subscription.deleted event', async () => {
      const subscription = createMockStripeSubscription();
      const event = createMockStripeEvent(
        'customer.subscription.deleted',
        subscription,
      );
      mockStripeService.constructWebhookEvent.mockReturnValue(event);

      await controller.handleWebhook('sig_test', {
        rawBody: Buffer.from('payload'),
      } as any);

      expect(mockStripeService.handleSubscriptionDeleted).toHaveBeenCalled();
    });

    it('should process invoice.payment_succeeded event', async () => {
      const invoice = createMockStripeInvoice();
      const event = createMockStripeEvent('invoice.payment_succeeded', invoice);
      mockStripeService.constructWebhookEvent.mockReturnValue(event);

      await controller.handleWebhook('sig_test', {
        rawBody: Buffer.from('payload'),
      } as any);

      expect(
        mockStripeService.handleInvoicePaymentSucceeded,
      ).toHaveBeenCalled();
    });

    it('should process invoice.payment_failed event', async () => {
      const invoice = createMockStripeInvoice();
      const event = createMockStripeEvent('invoice.payment_failed', invoice);
      mockStripeService.constructWebhookEvent.mockReturnValue(event);

      await controller.handleWebhook('sig_test', {
        rawBody: Buffer.from('payload'),
      } as any);

      expect(mockStripeService.handleInvoicePaymentFailed).toHaveBeenCalled();
    });

    it('should handle unhandled event types gracefully', async () => {
      const event = createMockStripeEvent('some.unknown.event', {});
      mockStripeService.constructWebhookEvent.mockReturnValue(event);

      const result = await controller.handleWebhook('sig_test', {
        rawBody: Buffer.from('payload'),
      } as any);

      expect(result).toEqual({ received: true });
    });

    it('should throw on signature verification failure', async () => {
      mockStripeService.constructWebhookEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        controller.handleWebhook('invalid_sig', {
          rawBody: Buffer.from('payload'),
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
