import { Test, TestingModule } from '@nestjs/testing';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

describe('UsageController', () => {
  let controller: UsageController;
  let mockUsageService: any;

  beforeEach(async () => {
    mockUsageService = {
      getIncompleteResetJob: jest.fn(),
      getResetJobStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsageController],
      providers: [{ provide: UsageService, useValue: mockUsageService }],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsageController>(UsageController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getResetStatus', () => {
    it('should return idle status when no active job', async () => {
      mockUsageService.getIncompleteResetJob.mockResolvedValue(null);

      const result = await controller.getResetStatus();

      expect(result.status).toBe('idle');
      expect(result.message).toBe('No active reset job');
    });

    it('should return in_progress status with job details', async () => {
      const incompleteJob = {
        id: 'job-123',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        processedUsers: 50,
        totalUsers: 100,
        failedUsers: ['user-1', 'user-2'],
        lastProcessedUid: 'user-50',
      };
      mockUsageService.getIncompleteResetJob.mockResolvedValue(incompleteJob);

      const result = await controller.getResetStatus();

      expect(result.status).toBe('in_progress');
      expect(result.jobId).toBe('job-123');
      expect(result.progress.processed).toBe(50);
      expect(result.progress.total).toBe(100);
      expect(result.progress.percentage).toBe(50);
      expect(result.failedUsers).toBe(2);
      expect(result.lastProcessedUid).toBe('user-50');
    });

    it('should handle zero total users', async () => {
      const incompleteJob = {
        id: 'job-123',
        startedAt: new Date(),
        processedUsers: 0,
        totalUsers: 0,
        failedUsers: [],
        lastProcessedUid: null,
      };
      mockUsageService.getIncompleteResetJob.mockResolvedValue(incompleteJob);

      const result = await controller.getResetStatus();

      expect(result.status).toBe('in_progress');
      expect(result.progress.percentage).toBe(0);
    });

    it('should handle undefined failedUsers', async () => {
      const incompleteJob = {
        id: 'job-123',
        startedAt: new Date(),
        processedUsers: 10,
        totalUsers: 100,
      };
      mockUsageService.getIncompleteResetJob.mockResolvedValue(incompleteJob);

      const result = await controller.getResetStatus();

      expect(result.failedUsers).toBe(0);
    });

    it('should return error status on exception', async () => {
      mockUsageService.getIncompleteResetJob.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await controller.getResetStatus();

      expect(result.status).toBe('error');
      expect(result.message).toBe('Database connection failed');
    });
  });

  describe('getResetJob', () => {
    it('should return job details when found', async () => {
      const job = {
        id: 'job-123',
        status: 'completed',
        completedAt: new Date(),
        processedUsers: 100,
        totalUsers: 100,
      };
      mockUsageService.getResetJobStatus.mockResolvedValue(job);

      const result = await controller.getResetJob('job-123');

      expect(result.status).toBe('success');
      expect(result.job).toEqual(job);
      expect(mockUsageService.getResetJobStatus).toHaveBeenCalledWith(
        'job-123',
      );
    });

    it('should return not_found when job does not exist', async () => {
      mockUsageService.getResetJobStatus.mockResolvedValue(null);

      const result = await controller.getResetJob('nonexistent-job');

      expect(result.status).toBe('not_found');
      expect(result.message).toContain('nonexistent-job');
    });

    it('should return error status on exception', async () => {
      mockUsageService.getResetJobStatus.mockRejectedValue(
        new Error('Query failed'),
      );

      const result = await controller.getResetJob('job-123');

      expect(result.status).toBe('error');
      expect(result.message).toBe('Query failed');
    });
  });
});
