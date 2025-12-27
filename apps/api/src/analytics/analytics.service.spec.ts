import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'GA4_MEASUREMENT_ID') return 'G-TEST123';
        if (key === 'GA4_API_SECRET') return 'secret123';
        return null;
      }),
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should enable analytics when credentials are provided', () => {
      expect(service).toBeDefined();
    });

    it('should disable analytics when credentials are missing', async () => {
      mockConfigService.get = jest.fn().mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AnalyticsService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const disabledService = module.get<AnalyticsService>(AnalyticsService);
      expect(disabledService).toBeDefined();
    });
  });

  describe('trackPurchase', () => {
    it('should send purchase event to GA4', async () => {
      await service.trackPurchase(
        'user-123',
        'txn_abc123',
        29.99,
        'USD',
        'professional',
        'monthly',
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('google-analytics.com/mp/collect'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(callBody.events[0].name).toBe('purchase');
      expect(callBody.events[0].params.transaction_id).toBe('txn_abc123');
      expect(callBody.events[0].params.value).toBe(29.99);
    });

    it('should not send event when analytics is disabled', async () => {
      mockConfigService.get = jest.fn().mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AnalyticsService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const disabledService = module.get<AnalyticsService>(AnalyticsService);
      await disabledService.trackPurchase(
        'user-123',
        'txn_abc123',
        29.99,
        'USD',
        'professional',
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(
        service.trackPurchase(
          'user-123',
          'txn_abc123',
          29.99,
          'USD',
          'professional',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('trackRefund', () => {
    it('should send refund event to GA4', async () => {
      await service.trackRefund(
        'user-123',
        'txn_abc123',
        29.99,
        'USD',
        'professional',
      );

      expect(global.fetch).toHaveBeenCalled();
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(callBody.events[0].name).toBe('refund');
    });

    it('should not send event when analytics is disabled', async () => {
      mockConfigService.get = jest.fn().mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AnalyticsService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const disabledService = module.get<AnalyticsService>(AnalyticsService);
      await disabledService.trackRefund(
        'user-123',
        'txn_abc123',
        29.99,
        'USD',
        'professional',
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        service.trackRefund(
          'user-123',
          'txn_abc123',
          29.99,
          'USD',
          'professional',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('trackSubscriptionUpdate', () => {
    it('should send subscription update event to GA4', async () => {
      await service.trackSubscriptionUpdate(
        'user-123',
        'sub_abc123',
        'free',
        'professional',
        29.99,
        'USD',
      );

      expect(global.fetch).toHaveBeenCalled();
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(callBody.events[0].name).toBe('subscription_updated');
      expect(callBody.events[0].params.from_tier).toBe('free');
      expect(callBody.events[0].params.to_tier).toBe('professional');
    });

    it('should not send event when analytics is disabled', async () => {
      mockConfigService.get = jest.fn().mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AnalyticsService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const disabledService = module.get<AnalyticsService>(AnalyticsService);
      await disabledService.trackSubscriptionUpdate(
        'user-123',
        'sub_abc123',
        'free',
        'professional',
        29.99,
        'USD',
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        service.trackSubscriptionUpdate(
          'user-123',
          'sub_abc123',
          'free',
          'professional',
          29.99,
          'USD',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('trackPaymentFailed', () => {
    it('should send payment failure event to GA4', async () => {
      await service.trackPaymentFailed(
        'user-123',
        'card_declined',
        'professional',
      );

      expect(global.fetch).toHaveBeenCalled();
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(callBody.events[0].name).toBe('payment_failed');
      expect(callBody.events[0].params.failure_reason).toBe('card_declined');
    });

    it('should not send event when analytics is disabled', async () => {
      mockConfigService.get = jest.fn().mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AnalyticsService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const disabledService = module.get<AnalyticsService>(AnalyticsService);
      await disabledService.trackPaymentFailed('user-123', 'card_declined');

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        service.trackPaymentFailed('user-123', 'card_declined'),
      ).resolves.not.toThrow();
    });
  });

  describe('trackRecurringPayment', () => {
    it('should send recurring payment event to GA4', async () => {
      await service.trackRecurringPayment(
        'user-123',
        'inv_abc123',
        29.99,
        'USD',
        'professional',
      );

      expect(global.fetch).toHaveBeenCalled();
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body,
      );
      expect(callBody.events[0].name).toBe('recurring_payment_succeeded');
      expect(callBody.events[0].params.invoice_id).toBe('inv_abc123');
    });

    it('should not send event when analytics is disabled', async () => {
      mockConfigService.get = jest.fn().mockReturnValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AnalyticsService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const disabledService = module.get<AnalyticsService>(AnalyticsService);
      await disabledService.trackRecurringPayment(
        'user-123',
        'inv_abc123',
        29.99,
        'USD',
        'professional',
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        service.trackRecurringPayment(
          'user-123',
          'inv_abc123',
          29.99,
          'USD',
          'professional',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('sendEvent (private)', () => {
    it('should handle non-ok response from GA4', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Should not throw, error is caught internally
      await expect(
        service.trackPurchase(
          'user-123',
          'txn_abc123',
          29.99,
          'USD',
          'professional',
        ),
      ).resolves.not.toThrow();
    });
  });
});
