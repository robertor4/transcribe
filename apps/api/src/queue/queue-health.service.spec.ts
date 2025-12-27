import { Test, TestingModule } from '@nestjs/testing';
import { QueueHealthService } from './queue-health.service';
import { getQueueToken } from '@nestjs/bull';
import { QUEUE_NAMES, TranscriptionStatus } from '@transcribe/shared';
import { FirebaseService } from '../firebase/firebase.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { createMockFirebaseService } from '../../test/mocks';

describe('QueueHealthService', () => {
  let service: QueueHealthService;
  let mockQueue: any;
  let mockFirebaseService: any;
  let mockWebSocketGateway: any;

  beforeEach(async () => {
    mockQueue = {
      getActive: jest.fn().mockResolvedValue([]),
      getWaiting: jest.fn().mockResolvedValue([]),
      getDelayed: jest.fn().mockResolvedValue([]),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(10),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
    };

    mockFirebaseService = {
      ...createMockFirebaseService(),
      firestore: {
        collection: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              size: 0,
              docs: [],
            }),
          }),
        }),
      },
    };

    mockWebSocketGateway = {
      sendTranscriptionProgress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueHealthService,
        {
          provide: getQueueToken(QUEUE_NAMES.TRANSCRIPTION),
          useValue: mockQueue,
        },
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: WebSocketGateway, useValue: mockWebSocketGateway },
      ],
    }).compile();

    service = module.get<QueueHealthService>(QueueHealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should check stale jobs and log statistics on init', async () => {
      await service.onModuleInit();

      expect(mockQueue.getActive).toHaveBeenCalled();
      expect(mockQueue.getWaitingCount).toHaveBeenCalled();
    });
  });

  describe('checkStaleJobs', () => {
    it('should log when no stale jobs detected', async () => {
      mockQueue.getActive.mockResolvedValue([]);
      mockFirebaseService.firestore.collection().where().get.mockResolvedValue({
        size: 0,
        docs: [],
      });

      await service.checkStaleJobs();

      expect(mockQueue.getActive).toHaveBeenCalled();
    });

    it('should detect stale transcriptions without active jobs', async () => {
      mockQueue.getActive.mockResolvedValue([]);
      mockQueue.getWaiting.mockResolvedValue([]);
      mockQueue.getDelayed.mockResolvedValue([]);

      mockFirebaseService.firestore
        .collection()
        .where()
        .get.mockResolvedValue({
          size: 1,
          docs: [
            {
              id: 'trans-123',
              data: () => ({
                userId: 'user-123',
                status: TranscriptionStatus.PROCESSING,
              }),
            },
          ],
        });

      await service.checkStaleJobs();

      expect(mockQueue.getWaiting).toHaveBeenCalled();
      expect(mockQueue.getDelayed).toHaveBeenCalled();
    });

    it('should recover pending jobs and notify user', async () => {
      mockQueue.getActive.mockResolvedValue([]);
      mockQueue.getWaiting.mockResolvedValue([
        { data: { transcriptionId: 'trans-123' } },
      ]);
      mockQueue.getDelayed.mockResolvedValue([]);

      mockFirebaseService.firestore
        .collection()
        .where()
        .get.mockResolvedValue({
          size: 1,
          docs: [
            {
              id: 'trans-123',
              data: () => ({
                userId: 'user-123',
                status: TranscriptionStatus.PROCESSING,
              }),
            },
          ],
        });

      await service.checkStaleJobs();

      expect(
        mockWebSocketGateway.sendTranscriptionProgress,
      ).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          transcriptionId: 'trans-123',
          status: TranscriptionStatus.PROCESSING,
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      mockQueue.getActive.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      // Should not throw
      await expect(service.checkStaleJobs()).resolves.toBeUndefined();
    });
  });

  describe('logQueueStatistics', () => {
    it('should log queue statistics', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(5);
      mockQueue.getActiveCount.mockResolvedValue(2);
      mockQueue.getCompletedCount.mockResolvedValue(100);
      mockQueue.getFailedCount.mockResolvedValue(3);
      mockQueue.getDelayedCount.mockResolvedValue(1);

      await service.logQueueStatistics();

      expect(mockQueue.getWaitingCount).toHaveBeenCalled();
      expect(mockQueue.getActiveCount).toHaveBeenCalled();
      expect(mockQueue.getCompletedCount).toHaveBeenCalled();
      expect(mockQueue.getFailedCount).toHaveBeenCalled();
      expect(mockQueue.getDelayedCount).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockQueue.getWaitingCount.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(service.logQueueStatistics()).resolves.toBeUndefined();
    });
  });

  describe('getQueueHealth', () => {
    it('should return healthy status when failed count is low', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(5);
      mockQueue.getActiveCount.mockResolvedValue(2);
      mockQueue.getCompletedCount.mockResolvedValue(100);
      mockQueue.getFailedCount.mockResolvedValue(10);
      mockQueue.getDelayedCount.mockResolvedValue(1);

      const result = await service.getQueueHealth();

      expect(result.healthy).toBe(true);
      expect(result.stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 10,
        delayed: 1,
      });
    });

    it('should return unhealthy status when failed count is high', async () => {
      mockQueue.getWaitingCount.mockResolvedValue(0);
      mockQueue.getActiveCount.mockResolvedValue(0);
      mockQueue.getCompletedCount.mockResolvedValue(50);
      mockQueue.getFailedCount.mockResolvedValue(150);
      mockQueue.getDelayedCount.mockResolvedValue(0);

      const result = await service.getQueueHealth();

      expect(result.healthy).toBe(false);
      expect(result.stats.failed).toBe(150);
    });
  });
});
