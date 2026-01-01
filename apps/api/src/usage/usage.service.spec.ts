import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsageService } from './usage.service';
import { FirebaseService } from '../firebase/firebase.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception';
import {
  createMockUserRepository,
  createMockFirestore,
} from '../../test/mocks';
import {
  createTestUser,
  createProfessionalUser,
  createAdminUser,
  createUserWithUsage,
  createOverQuotaProfessionalUser,
} from '../../test/factories';

describe('UsageService', () => {
  let service: UsageService;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockFirestore: ReturnType<typeof createMockFirestore>;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  beforeEach(async () => {
    mockUserRepository = createMockUserRepository();
    mockFirestore = createMockFirestore();

    const mockFirebaseService = {
      db: mockFirestore,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkQuota', () => {
    describe('free tier', () => {
      it('should pass if under 3 transcriptions limit', async () => {
        const user = createUserWithUsage(0, 2);
        mockUserRepository.getUser.mockResolvedValue(user);

        await expect(
          service.checkQuota(user.uid, 1024 * 1024, 10), // 1MB, 10 minutes
        ).resolves.not.toThrow();
      });

      it('should throw PaymentRequiredException at 3 transcriptions', async () => {
        const user = createUserWithUsage(0, 3);
        mockUserRepository.getUser.mockResolvedValue(user);

        await expect(
          service.checkQuota(user.uid, 1024 * 1024, 10),
        ).rejects.toThrow(PaymentRequiredException);
      });

      it('should throw on file exceeding 100MB', async () => {
        const user = createTestUser();
        mockUserRepository.getUser.mockResolvedValue(user);

        const fileSizeOver100MB = 101 * 1024 * 1024;

        await expect(
          service.checkQuota(user.uid, fileSizeOver100MB, 10),
        ).rejects.toThrow(PaymentRequiredException);
      });

      it('should throw on file exceeding 30 min duration', async () => {
        const user = createTestUser();
        mockUserRepository.getUser.mockResolvedValue(user);

        await expect(
          service.checkQuota(user.uid, 1024 * 1024, 35), // 35 minutes
        ).rejects.toThrow(PaymentRequiredException);
      });

      it('should include quota exceeded code in error', async () => {
        const user = createUserWithUsage(0, 3);
        mockUserRepository.getUser.mockResolvedValue(user);

        try {
          await service.checkQuota(user.uid, 1024 * 1024, 10);
          fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(PaymentRequiredException);
          expect((error as PaymentRequiredException).errorCode).toBe(
            'QUOTA_EXCEEDED_TRANSCRIPTIONS',
          );
        }
      });
    });

    describe('professional tier', () => {
      it('should allow processing within 60 hour limit', async () => {
        const user = createProfessionalUser();
        user.usageThisMonth = {
          hours: 50,
          transcriptions: 100,
          onDemandAnalyses: 50,
          lastResetAt: new Date(),
        };
        mockUserRepository.getUser.mockResolvedValue(user);

        await expect(
          service.checkQuota(user.uid, 1024 * 1024, 60), // 1 hour
        ).resolves.not.toThrow();
      });

      it('should warn but allow overage up to 100 hours', async () => {
        const user = createOverQuotaProfessionalUser(70); // 70 hours used
        mockUserRepository.getUser.mockResolvedValue(user);

        // 15 more hours should be allowed (total 85, under 100 cap)
        await expect(
          service.checkQuota(user.uid, 1024 * 1024, 15 * 60), // 15 hours
        ).resolves.not.toThrow();
      });

      it('should throw at 100 hour hard cap', async () => {
        const user = createOverQuotaProfessionalUser(95); // 95 hours used
        mockUserRepository.getUser.mockResolvedValue(user);

        // 10 more hours would exceed 100 hour cap
        await expect(
          service.checkQuota(user.uid, 1024 * 1024, 10 * 60), // 10 hours
        ).rejects.toThrow(PaymentRequiredException);
      });

      it('should allow up to 5GB file size', async () => {
        const user = createProfessionalUser();
        mockUserRepository.getUser.mockResolvedValue(user);

        const fileSize4GB = 4 * 1024 * 1024 * 1024;

        await expect(
          service.checkQuota(user.uid, fileSize4GB, 60),
        ).resolves.not.toThrow();
      });

      it('should throw on file exceeding 5GB', async () => {
        const user = createProfessionalUser();
        mockUserRepository.getUser.mockResolvedValue(user);

        const fileSize6GB = 6 * 1024 * 1024 * 1024;

        await expect(
          service.checkQuota(user.uid, fileSize6GB, 60),
        ).rejects.toThrow(PaymentRequiredException);
      });
    });

    describe('admin bypass', () => {
      it('should skip all checks for admin users', async () => {
        const adminUser = createAdminUser();
        // Even with zero transcriptions left, admin should pass
        adminUser.usageThisMonth = {
          hours: 1000,
          transcriptions: 1000,
          onDemandAnalyses: 1000,
          lastResetAt: new Date(),
        };
        mockUserRepository.getUser.mockResolvedValue(adminUser);

        await expect(
          service.checkQuota(adminUser.uid, 100 * 1024 * 1024 * 1024, 1000),
        ).resolves.not.toThrow();
      });
    });

    describe('user not found', () => {
      it('should throw NotFoundException if user not found', async () => {
        mockUserRepository.getUser.mockResolvedValue(null);

        await expect(
          service.checkQuota('unknown-user', 1024, 10),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('checkOnDemandAnalysisQuota', () => {
    it('should pass if under 2 analyses limit for free tier', async () => {
      const user = createTestUser();
      user.usageThisMonth = {
        hours: 0,
        transcriptions: 0,
        onDemandAnalyses: 1,
        lastResetAt: new Date(),
      };
      mockUserRepository.getUser.mockResolvedValue(user);

      await expect(
        service.checkOnDemandAnalysisQuota(user.uid),
      ).resolves.not.toThrow();
    });

    it('should throw at 2 analyses limit for free tier', async () => {
      const user = createTestUser();
      user.usageThisMonth = {
        hours: 0,
        transcriptions: 0,
        onDemandAnalyses: 2,
        lastResetAt: new Date(),
      };
      mockUserRepository.getUser.mockResolvedValue(user);

      await expect(
        service.checkOnDemandAnalysisQuota(user.uid),
      ).rejects.toThrow(PaymentRequiredException);
    });

    it('should allow unlimited analyses for professional tier', async () => {
      const user = createProfessionalUser();
      user.usageThisMonth = {
        hours: 0,
        transcriptions: 0,
        onDemandAnalyses: 100,
        lastResetAt: new Date(),
      };
      mockUserRepository.getUser.mockResolvedValue(user);

      await expect(
        service.checkOnDemandAnalysisQuota(user.uid),
      ).resolves.not.toThrow();
    });

    it('should skip for admin users', async () => {
      const adminUser = createAdminUser();
      mockUserRepository.getUser.mockResolvedValue(adminUser);

      await expect(
        service.checkOnDemandAnalysisQuota(adminUser.uid),
      ).resolves.not.toThrow();
    });
  });

  describe('trackTranscription', () => {
    it('should increment hours and transcription count', async () => {
      const user = createTestUser();
      user.usageThisMonth = {
        hours: 5,
        transcriptions: 10,
        onDemandAnalyses: 0,
        lastResetAt: new Date(),
      };
      mockUserRepository.getUser.mockResolvedValue(user);

      await service.trackTranscription(user.uid, 'trans-123', 3600); // 1 hour

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        user.uid,
        expect.objectContaining({
          usageThisMonth: {
            hours: 6, // 5 + 1
            transcriptions: 11, // 10 + 1
            onDemandAnalyses: 0,
            lastResetAt: expect.any(Date),
          },
        }),
      );
    });

    it('should create usage record for analytics', async () => {
      const user = createTestUser();
      mockUserRepository.getUser.mockResolvedValue(user);

      await service.trackTranscription(user.uid, 'trans-123', 3600);

      // Verify usage record was created via Firestore
      expect(mockFirestore.collection).toHaveBeenCalledWith('usageRecords');
    });
  });

  describe('trackOnDemandAnalysis', () => {
    it('should increment on-demand analysis count', async () => {
      const user = createTestUser();
      user.usageThisMonth = {
        hours: 0,
        transcriptions: 0,
        onDemandAnalyses: 5,
        lastResetAt: new Date(),
      };
      mockUserRepository.getUser.mockResolvedValue(user);

      await service.trackOnDemandAnalysis(user.uid, 'analysis-123');

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        user.uid,
        expect.objectContaining({
          usageThisMonth: expect.objectContaining({
            onDemandAnalyses: 6, // 5 + 1
          }),
        }),
      );
    });
  });

  describe('calculateOverage', () => {
    it('should return 0 for free tier users', async () => {
      const user = createTestUser();
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.calculateOverage(user.uid);

      expect(result).toEqual({ hours: 0, amount: 0 });
    });

    it('should calculate overage hours correctly', async () => {
      const user = createOverQuotaProfessionalUser(70); // 70 hours used, 60 limit
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.calculateOverage(user.uid);

      expect(result.hours).toBe(10); // 70 - 60 = 10 hours overage
    });

    it('should calculate overage cost at $0.50/hour', async () => {
      const user = createOverQuotaProfessionalUser(70); // 10 hours overage
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.calculateOverage(user.uid);

      expect(result.amount).toBe(500); // 10 hours * $0.50 * 100 cents
    });

    it('should round up to nearest cent', async () => {
      const user = createProfessionalUser();
      user.usageThisMonth = {
        hours: 60.3, // 0.3 hours overage
        transcriptions: 0,
        onDemandAnalyses: 0,
        lastResetAt: new Date(),
      };
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.calculateOverage(user.uid);

      // 0.3 hours * $0.50 = $0.15 = 15 cents
      expect(result.amount).toBe(15);
    });

    it('should return 0 if user not found', async () => {
      mockUserRepository.getUser.mockResolvedValue(null);

      const result = await service.calculateOverage('unknown-user');

      expect(result).toEqual({ hours: 0, amount: 0 });
    });
  });

  describe('resetMonthlyUsage', () => {
    it('should reset all usage counters to zero', async () => {
      await service.resetMonthlyUsage('user-123');

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'user-123',
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
  });

  describe('getUsageStats', () => {
    it('should return usage stats for user', async () => {
      const user = createProfessionalUser();
      user.usageThisMonth = {
        hours: 30,
        transcriptions: 50,
        onDemandAnalyses: 10,
        lastResetAt: new Date(),
      };
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.getUsageStats(user.uid);

      expect(result.tier).toBe('professional');
      expect(result.usage.hours).toBe(30);
      expect(result.usage.transcriptions).toBe(50);
    });

    it('should calculate percent used for free tier', async () => {
      const user = createUserWithUsage(0, 2); // 2 of 3 transcriptions
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.getUsageStats(user.uid);

      // 2/3 = 66.67%
      expect(result.percentUsed).toBeCloseTo(66.67, 0);
    });

    it('should calculate percent used for professional tier', async () => {
      const user = createProfessionalUser();
      user.usageThisMonth = {
        hours: 48, // 48 of 60 hours
        transcriptions: 0,
        onDemandAnalyses: 0,
        lastResetAt: new Date(),
      };
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.getUsageStats(user.uid);

      // 48/60 = 80%
      expect(result.percentUsed).toBe(80);
    });

    it('should generate warning at 80% usage', async () => {
      const user = createProfessionalUser();
      user.usageThisMonth = {
        hours: 50, // 50 of 60 hours = 83%
        transcriptions: 0,
        onDemandAnalyses: 0,
        lastResetAt: new Date(),
      };
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.getUsageStats(user.uid);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('83%');
    });

    it('should generate warning for overage', async () => {
      const user = createOverQuotaProfessionalUser(70);
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.getUsageStats(user.uid);

      expect(result.warnings.some((w) => w.includes('overage'))).toBe(true);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.getUser.mockResolvedValue(null);

      await expect(service.getUsageStats('unknown-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createResetJob', () => {
    it('should create reset job document in Firestore', async () => {
      const mockDoc = {
        set: jest.fn().mockResolvedValue(undefined),
      };
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      const jobId = await service.createResetJob('2024-01');

      expect(jobId).toBe('reset-2024-01');
      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'reset-2024-01',
          status: 'in_progress',
        }),
      );
    });
  });

  describe('completeResetJob', () => {
    it('should mark job as completed with failed users list', async () => {
      const mockDoc = {
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      await service.completeResetJob('reset-2024-01', ['user1', 'user2']);

      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          failedUsers: ['user1', 'user2'],
        }),
      );
    });
  });
});
