import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SubscriptionGuard, OnDemandAnalysisGuard } from './subscription.guard';
import { UsageService } from '../usage/usage.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception';
import { UserRole } from '@transcribe/shared';
import { createMockUserRepository } from '../../test/mocks';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;
  let mockUsageService: any;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;

  const createMockContext = (
    user: any,
    file?: { size: number; mimetype: string },
    files?: { size: number; mimetype: string }[],
  ): ExecutionContext => {
    const request = { user, file, files };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    mockUsageService = {
      checkQuota: jest.fn().mockResolvedValue(undefined),
    };
    mockUserRepository = createMockUserRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        { provide: UsageService, useValue: mockUsageService },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    guard = module.get<SubscriptionGuard>(SubscriptionGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when user not authenticated', async () => {
      const context = createMockContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should allow admin users without quota check', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.ADMIN });
      const context = createMockContext(
        { uid: 'admin-user' },
        { size: 100000000, mimetype: 'audio/mp3' },
      );

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockUsageService.checkQuota).not.toHaveBeenCalled();
    });

    it('should allow requests without file upload', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      const context = createMockContext({ uid: 'user-123' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockUsageService.checkQuota).not.toHaveBeenCalled();
    });

    it('should check quota for file uploads', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      const file = { size: 10 * 1024 * 1024, mimetype: 'audio/mp3' }; // 10MB
      const context = createMockContext({ uid: 'user-123' }, file);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockUsageService.checkQuota).toHaveBeenCalledWith(
        'user-123',
        10 * 1024 * 1024,
        expect.any(Number),
      );
    });

    it('should check quota with files array', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      const files = [{ size: 5 * 1024 * 1024, mimetype: 'audio/wav' }];
      const context = createMockContext({ uid: 'user-123' }, undefined, files);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockUsageService.checkQuota).toHaveBeenCalled();
    });

    it('should rethrow PaymentRequiredException', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      const error = new PaymentRequiredException('Quota exceeded');
      mockUsageService.checkQuota.mockRejectedValue(error);
      const context = createMockContext(
        { uid: 'user-123' },
        { size: 1000000, mimetype: 'audio/mp3' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        PaymentRequiredException,
      );
    });

    it('should rethrow other errors', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      mockUsageService.checkQuota.mockRejectedValue(
        new Error('Database error'),
      );
      const context = createMockContext(
        { uid: 'user-123' },
        { size: 1000000, mimetype: 'audio/mp3' },
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Database error',
      );
    });

    it('should estimate higher duration for uncompressed formats', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      const file = { size: 100 * 1024 * 1024, mimetype: 'audio/wav' }; // 100MB WAV
      const context = createMockContext({ uid: 'user-123' }, file);

      await guard.canActivate(context);

      // WAV at ~10MB/min should estimate 10 minutes
      expect(mockUsageService.checkQuota).toHaveBeenCalledWith(
        'user-123',
        100 * 1024 * 1024,
        10, // 100MB / 10MB per minute = 10 minutes
      );
    });

    it('should cap duration estimate at 480 minutes', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      const file = { size: 10 * 1024 * 1024 * 1024, mimetype: 'audio/mp3' }; // 10GB
      const context = createMockContext({ uid: 'user-123' }, file);

      await guard.canActivate(context);

      expect(mockUsageService.checkQuota).toHaveBeenCalledWith(
        'user-123',
        expect.any(Number),
        480, // Max cap
      );
    });

    it('should use default rate for unknown mime types', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      const file = { size: 10 * 1024 * 1024, mimetype: 'audio/unknown' }; // 10MB unknown
      const context = createMockContext({ uid: 'user-123' }, file);

      await guard.canActivate(context);

      // Default rate is 1MB/min
      expect(mockUsageService.checkQuota).toHaveBeenCalledWith(
        'user-123',
        10 * 1024 * 1024,
        10,
      );
    });
  });
});

describe('OnDemandAnalysisGuard', () => {
  let guard: OnDemandAnalysisGuard;
  let mockUsageService: any;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;

  const createMockContext = (user: any): ExecutionContext => {
    const request = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    mockUsageService = {
      checkOnDemandAnalysisQuota: jest.fn().mockResolvedValue(undefined),
    };
    mockUserRepository = createMockUserRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnDemandAnalysisGuard,
        { provide: UsageService, useValue: mockUsageService },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    guard = module.get<OnDemandAnalysisGuard>(OnDemandAnalysisGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when user not authenticated', async () => {
      const context = createMockContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should allow admin users without quota check', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.ADMIN });
      const context = createMockContext({ uid: 'admin-user' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(
        mockUsageService.checkOnDemandAnalysisQuota,
      ).not.toHaveBeenCalled();
    });

    it('should check quota for regular users', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      const context = createMockContext({ uid: 'user-123' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockUsageService.checkOnDemandAnalysisQuota).toHaveBeenCalledWith(
        'user-123',
      );
    });

    it('should rethrow PaymentRequiredException', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      const error = new PaymentRequiredException('Analysis limit reached');
      mockUsageService.checkOnDemandAnalysisQuota.mockRejectedValue(error);
      const context = createMockContext({ uid: 'user-123' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        PaymentRequiredException,
      );
    });

    it('should rethrow other errors', async () => {
      mockUserRepository.getUser.mockResolvedValue({ role: UserRole.USER });
      mockUsageService.checkOnDemandAnalysisQuota.mockRejectedValue(
        new Error('Service unavailable'),
      );
      const context = createMockContext({ uid: 'user-123' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Service unavailable',
      );
    });
  });
});
