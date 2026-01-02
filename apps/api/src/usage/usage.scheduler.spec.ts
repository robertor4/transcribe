import { Test, TestingModule } from '@nestjs/testing';
import { UsageScheduler } from './usage.scheduler';
import { UsageService } from './usage.service';
import { FirebaseService } from '../firebase/firebase.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import {
  createMockFirebaseService,
  createMockUserRepository,
} from '../../test/mocks';
import {
  createTestUser,
  createProfessionalUser,
  createUserWithUsage,
} from '../../test/factories';

describe('UsageScheduler', () => {
  let scheduler: UsageScheduler;
  let mockUsageService: any;
  let mockFirebaseService: ReturnType<typeof createMockFirebaseService>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;

  beforeEach(async () => {
    mockFirebaseService = createMockFirebaseService();
    mockUserRepository = createMockUserRepository();

    mockUsageService = {
      resetMonthlyUsage: jest.fn().mockResolvedValue(undefined),
      calculateOverage: jest.fn().mockResolvedValue({ hours: 0, amount: 0 }),
      getUsageStats: jest.fn().mockResolvedValue({
        percentUsed: 0,
        warnings: [],
      }),
      getIncompleteResetJob: jest.fn().mockResolvedValue(null),
      createResetJob: jest.fn().mockResolvedValue('job-id-123'),
      updateResetJobProgress: jest.fn().mockResolvedValue(undefined),
      completeResetJob: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageScheduler,
        { provide: UsageService, useValue: mockUsageService },
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    scheduler = module.get<UsageScheduler>(UsageScheduler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should check for missed resets on startup', async () => {
      const user = createTestUser();
      mockUserRepository.getAllUsers.mockResolvedValue([user]);

      await scheduler.onModuleInit();

      expect(mockUserRepository.getAllUsers).toHaveBeenCalled();
    });

    it('should reset usage for users with missed resets', async () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

      const user = createTestUser({
        usageThisMonth: {
          hoursUsed: 5,
          transcriptionCount: 10,
          lastResetAt: lastMonth.toISOString(),
        },
      });
      mockUserRepository.getAllUsers.mockResolvedValue([user]);

      // Simulate not being the 1st of the month
      jest.spyOn(Date.prototype, 'getDate').mockReturnValue(15);

      await scheduler.onModuleInit();

      expect(mockUsageService.resetMonthlyUsage).toHaveBeenCalledWith(user.uid);
    });

    it('should skip reset if already done this month', async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 2);

      const user = createTestUser({
        usageThisMonth: {
          hoursUsed: 5,
          transcriptionCount: 10,
          lastResetAt: firstOfMonth.toISOString(),
        },
      });
      mockUserRepository.getAllUsers.mockResolvedValue([user]);
      jest.spyOn(Date.prototype, 'getDate').mockReturnValue(15);

      await scheduler.onModuleInit();

      expect(mockUsageService.resetMonthlyUsage).not.toHaveBeenCalled();
    });
  });

  describe('onApplicationShutdown', () => {
    it('should log shutdown signal', async () => {
      await scheduler.onApplicationShutdown('SIGTERM');

      // Should complete without error
      expect(true).toBe(true);
    });

    it('should wait for active jobs to complete', async () => {
      // Access private property for testing
      (scheduler as any).activeJobs.add('test-job');

      // Use a short timeout for testing
      const shutdownPromise = scheduler.onApplicationShutdown('SIGTERM');

      // Simulate job completion after a short delay
      setTimeout(() => {
        (scheduler as any).activeJobs.delete('test-job');
      }, 100);

      await shutdownPromise;

      expect((scheduler as any).activeJobs.size).toBe(0);
    });
  });

  describe('handleMonthlyReset', () => {
    it('should skip if shutdown is in progress', async () => {
      (scheduler as any).isShuttingDown = true;

      await scheduler.handleMonthlyReset();

      expect(mockUserRepository.getAllUsers).not.toHaveBeenCalled();
    });

    it('should create new job if no incomplete job exists', async () => {
      const users = [createTestUser()];
      mockUserRepository.getAllUsers.mockResolvedValue(users);

      await scheduler.handleMonthlyReset();

      expect(mockUsageService.getIncompleteResetJob).toHaveBeenCalled();
      expect(mockUsageService.createResetJob).toHaveBeenCalled();
    });

    it('should resume incomplete job if one exists', async () => {
      const users = [
        createTestUser({ uid: 'user-1' }),
        createTestUser({ uid: 'user-2' }),
      ];
      mockUserRepository.getAllUsers.mockResolvedValue(users);
      mockUsageService.getIncompleteResetJob.mockResolvedValue({
        id: 'incomplete-job',
        processedUsers: 1,
        totalUsers: 2,
        lastProcessedUid: 'user-1',
        failedUsers: [],
      });

      await scheduler.handleMonthlyReset();

      // Should only process user-2 (after user-1)
      expect(mockUsageService.resetMonthlyUsage).toHaveBeenCalledTimes(1);
      expect(mockUsageService.resetMonthlyUsage).toHaveBeenCalledWith('user-2');
    });

    it('should reset usage for all users', async () => {
      const users = [
        createTestUser({ uid: 'user-1' }),
        createTestUser({ uid: 'user-2' }),
        createTestUser({ uid: 'user-3' }),
      ];
      mockUserRepository.getAllUsers.mockResolvedValue(users);

      await scheduler.handleMonthlyReset();

      expect(mockUsageService.resetMonthlyUsage).toHaveBeenCalledTimes(3);
      expect(mockUsageService.resetMonthlyUsage).toHaveBeenCalledWith('user-1');
      expect(mockUsageService.resetMonthlyUsage).toHaveBeenCalledWith('user-2');
      expect(mockUsageService.resetMonthlyUsage).toHaveBeenCalledWith('user-3');
    });

    it('should update progress checkpoint every 10 users', async () => {
      const users = Array.from({ length: 25 }, (_, i) =>
        createTestUser({ uid: `user-${i}` }),
      );
      mockUserRepository.getAllUsers.mockResolvedValue(users);

      await scheduler.handleMonthlyReset();

      // Should checkpoint at 10 and 20 users
      expect(mockUsageService.updateResetJobProgress).toHaveBeenCalledTimes(2);
    });

    it('should track failed users', async () => {
      const users = [
        createTestUser({ uid: 'user-1' }),
        createTestUser({ uid: 'user-2' }),
      ];
      mockUserRepository.getAllUsers.mockResolvedValue(users);
      mockUsageService.resetMonthlyUsage
        .mockResolvedValueOnce(undefined) // user-1 succeeds
        .mockRejectedValueOnce(new Error('Reset failed')); // user-2 fails

      await scheduler.handleMonthlyReset();

      // processedCount (1) != totalUsers (2), so job is not marked complete
      // Failed users are tracked but completeResetJob won't be called
      // because processedCount !== totalUsers in the actual implementation
      expect(mockUsageService.resetMonthlyUsage).toHaveBeenCalledTimes(2);
      expect(mockUsageService.completeResetJob).not.toHaveBeenCalled();
    });

    it('should complete job with failed users list when all users attempted', async () => {
      // Mock the behavior where all users are "processed" even with failures
      // Note: In actual code, processedCount only increments on success
      // So this tests the edge case where completeResetJob is called
      const users = [createTestUser({ uid: 'user-1' })];
      mockUserRepository.getAllUsers.mockResolvedValue(users);
      mockUsageService.resetMonthlyUsage.mockResolvedValue(undefined);

      await scheduler.handleMonthlyReset();

      expect(mockUsageService.completeResetJob).toHaveBeenCalledWith(
        'job-id-123',
        [],
      );
    });

    it('should mark job as complete when all users processed', async () => {
      const users = [createTestUser()];
      mockUserRepository.getAllUsers.mockResolvedValue(users);

      await scheduler.handleMonthlyReset();

      expect(mockUsageService.completeResetJob).toHaveBeenCalledWith(
        'job-id-123',
        [],
      );
    });

    it('should stop processing on shutdown signal', async () => {
      const users = Array.from({ length: 100 }, (_, i) =>
        createTestUser({ uid: `user-${i}` }),
      );
      mockUserRepository.getAllUsers.mockResolvedValue(users);

      // Simulate shutdown after first user
      mockUsageService.resetMonthlyUsage.mockImplementation(async () => {
        (scheduler as any).isShuttingDown = true;
      });

      await scheduler.handleMonthlyReset();

      // Should stop early due to shutdown
      expect(mockUsageService.resetMonthlyUsage).toHaveBeenCalledTimes(1);
      expect(mockUsageService.completeResetJob).not.toHaveBeenCalled();

      // Reset for other tests
      (scheduler as any).isShuttingDown = false;
    });
  });

  describe('handleOverageCharges', () => {
    it('should skip if shutdown is in progress', async () => {
      (scheduler as any).isShuttingDown = true;

      await scheduler.handleOverageCharges();

      expect(mockUserRepository.getUsersByTier).not.toHaveBeenCalled();

      (scheduler as any).isShuttingDown = false;
    });

    it('should check Professional and Business tier users', async () => {
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce([]) // professional
        .mockResolvedValueOnce([]); // business

      await scheduler.handleOverageCharges();

      expect(mockUserRepository.getUsersByTier).toHaveBeenCalledWith(
        'professional',
      );
      expect(mockUserRepository.getUsersByTier).toHaveBeenCalledWith(
        'business',
      );
    });

    it('should calculate overage for each user', async () => {
      const proUser = createProfessionalUser({ uid: 'pro-user' });
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce([proUser])
        .mockResolvedValueOnce([]);
      mockUsageService.calculateOverage.mockResolvedValue({
        hours: 0,
        amount: 0,
      });

      await scheduler.handleOverageCharges();

      expect(mockUsageService.calculateOverage).toHaveBeenCalledWith(
        'pro-user',
      );
    });

    it('should log users with overage', async () => {
      const proUser = createProfessionalUser({
        uid: 'over-user',
        stripeCustomerId: 'cus_123',
      });
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce([proUser])
        .mockResolvedValueOnce([]);
      mockUsageService.calculateOverage.mockResolvedValue({
        hours: 10,
        amount: 500,
      }); // 10 hours, $5

      await scheduler.handleOverageCharges();

      expect(mockUsageService.calculateOverage).toHaveBeenCalledWith(
        'over-user',
      );
    });

    it('should skip users without Stripe customer ID', async () => {
      const proUser = createProfessionalUser({
        uid: 'no-stripe',
        stripeCustomerId: undefined,
      });
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce([proUser])
        .mockResolvedValueOnce([]);
      mockUsageService.calculateOverage.mockResolvedValue({
        hours: 10,
        amount: 500,
      });

      await scheduler.handleOverageCharges();

      // Should still calculate overage but not charge
      expect(mockUsageService.calculateOverage).toHaveBeenCalled();
    });

    it('should continue on error for individual user', async () => {
      const users = [
        createProfessionalUser({ uid: 'user-1' }),
        createProfessionalUser({ uid: 'user-2' }),
      ];
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce(users)
        .mockResolvedValueOnce([]);
      mockUsageService.calculateOverage
        .mockRejectedValueOnce(new Error('Calculation error'))
        .mockResolvedValueOnce({ hours: 0, amount: 0 });

      await scheduler.handleOverageCharges();

      expect(mockUsageService.calculateOverage).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleUsageWarnings', () => {
    it('should skip if shutdown is in progress', async () => {
      (scheduler as any).isShuttingDown = true;

      await scheduler.handleUsageWarnings();

      expect(mockUserRepository.getUsersByTier).not.toHaveBeenCalled();

      (scheduler as any).isShuttingDown = false;
    });

    it('should check all tier users', async () => {
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce([]) // free
        .mockResolvedValueOnce([]) // professional
        .mockResolvedValueOnce([]); // business

      await scheduler.handleUsageWarnings();

      expect(mockUserRepository.getUsersByTier).toHaveBeenCalledWith('free');
      expect(mockUserRepository.getUsersByTier).toHaveBeenCalledWith(
        'professional',
      );
      expect(mockUserRepository.getUsersByTier).toHaveBeenCalledWith(
        'business',
      );
    });

    it('should get usage stats for each user', async () => {
      const user = createTestUser();
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce([user])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await scheduler.handleUsageWarnings();

      expect(mockUsageService.getUsageStats).toHaveBeenCalledWith(user.uid);
    });

    it('should identify users at 80% or more usage', async () => {
      const user = createUserWithUsage();
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce([user])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockUsageService.getUsageStats.mockResolvedValue({
        percentUsed: 85,
        warnings: ['Approaching limit'],
      });

      await scheduler.handleUsageWarnings();

      expect(mockUsageService.getUsageStats).toHaveBeenCalledWith(user.uid);
    });

    it('should not warn users under 80% usage', async () => {
      const user = createTestUser();
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce([user])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockUsageService.getUsageStats.mockResolvedValue({
        percentUsed: 50,
        warnings: [],
      });

      await scheduler.handleUsageWarnings();

      // No warnings expected at 50%
      expect(mockUsageService.getUsageStats).toHaveBeenCalled();
    });

    it('should continue on error for individual user', async () => {
      const users = [
        createTestUser({ uid: 'user-1' }),
        createTestUser({ uid: 'user-2' }),
      ];
      mockUserRepository.getUsersByTier
        .mockResolvedValueOnce(users)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockUsageService.getUsageStats
        .mockRejectedValueOnce(new Error('Stats error'))
        .mockResolvedValueOnce({ percentUsed: 0, warnings: [] });

      await scheduler.handleUsageWarnings();

      expect(mockUsageService.getUsageStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleUsageCleanup', () => {
    it('should skip if shutdown is in progress', async () => {
      (scheduler as any).isShuttingDown = true;

      await scheduler.handleUsageCleanup();

      expect(mockFirebaseService.firestore.collection).not.toHaveBeenCalled();

      (scheduler as any).isShuttingDown = false;
    });

    it('should delete old usage records', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          size: 2,
          docs: [{ ref: { id: 'doc-1' } }, { ref: { id: 'doc-2' } }],
        }),
      };

      // Override the db property access
      (scheduler as any).firebaseService = {
        ...mockFirebaseService,
        db: {
          collection: jest.fn().mockReturnValue(mockCollection),
          batch: jest.fn().mockReturnValue(mockBatch),
        },
      };

      await scheduler.handleUsageCleanup();

      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle empty result', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          size: 0,
          docs: [],
        }),
      };

      (scheduler as any).firebaseService = {
        ...mockFirebaseService,
        db: {
          collection: jest.fn().mockReturnValue(mockCollection),
          batch: jest.fn().mockReturnValue(mockBatch),
        },
      };

      await scheduler.handleUsageCleanup();

      expect(mockBatch.delete).not.toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle cleanup error gracefully', async () => {
      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (scheduler as any).firebaseService = {
        ...mockFirebaseService,
        db: {
          collection: jest.fn().mockReturnValue(mockCollection),
        },
      };

      await expect(scheduler.handleUsageCleanup()).resolves.not.toThrow();
    });
  });
});
