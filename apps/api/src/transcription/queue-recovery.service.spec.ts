import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { QueueRecoveryService } from './queue-recovery.service';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { FirebaseService } from '../firebase/firebase.service';
import { QUEUE_NAMES, TranscriptionStatus } from '@transcribe/shared';

describe('QueueRecoveryService', () => {
  let service: QueueRecoveryService;
  let mockQueue: any;
  let mockTranscriptionRepository: any;
  let mockFirebaseService: any;

  beforeEach(async () => {
    mockQueue = {
      on: jest.fn(),
      getActive: jest.fn().mockResolvedValue([]),
      getWaiting: jest.fn().mockResolvedValue([]),
      getDelayed: jest.fn().mockResolvedValue([]),
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };

    mockTranscriptionRepository = {
      updateTranscription: jest.fn().mockResolvedValue(undefined),
    };

    const mockFirestoreCollection = {
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
    };

    mockFirebaseService = {
      firestore: {
        collection: jest.fn().mockReturnValue(mockFirestoreCollection),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueRecoveryService,
        {
          provide: getQueueToken(QUEUE_NAMES.TRANSCRIPTION),
          useValue: mockQueue,
        },
        {
          provide: TranscriptionRepository,
          useValue: mockTranscriptionRepository,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    service = module.get<QueueRecoveryService>(QueueRecoveryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should set up queue event listeners', () => {
      service.onModuleInit();

      expect(mockQueue.on).toHaveBeenCalledWith(
        'stalled',
        expect.any(Function),
      );
      expect(mockQueue.on).toHaveBeenCalledWith('failed', expect.any(Function));
      expect(mockQueue.on).toHaveBeenCalledWith(
        'completed',
        expect.any(Function),
      );
    });

    it('should handle stalled job events', () => {
      service.onModuleInit();

      const stalledHandler = mockQueue.on.mock.calls.find(
        (call: any[]) => call[0] === 'stalled',
      )[1];

      // Should not throw
      expect(() =>
        stalledHandler({
          id: 'job-123',
          data: { transcriptionId: 'trans-123' },
        }),
      ).not.toThrow();
    });

    it('should handle failed job events', () => {
      service.onModuleInit();

      const failedHandler = mockQueue.on.mock.calls.find(
        (call: any[]) => call[0] === 'failed',
      )[1];

      expect(() =>
        failedHandler(
          { id: 'job-123', data: { transcriptionId: 'trans-123' } },
          new Error('Processing failed'),
        ),
      ).not.toThrow();
    });

    it('should handle completed job events', () => {
      service.onModuleInit();

      const completedHandler = mockQueue.on.mock.calls.find(
        (call: any[]) => call[0] === 'completed',
      )[1];

      expect(() =>
        completedHandler({
          id: 'job-123',
          data: { transcriptionId: 'trans-123' },
        }),
      ).not.toThrow();
    });
  });

  describe('recoverOrphanedJobs (via setTimeout in onModuleInit)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should skip recovery when no PROCESSING transcriptions found', async () => {
      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(mockCollection);

      service.onModuleInit();

      // Advance timers to trigger the delayed recovery
      jest.advanceTimersByTime(5000);

      // Wait for promises to resolve
      await Promise.resolve();
      await Promise.resolve();

      expect(mockCollection.where).toHaveBeenCalledWith(
        'status',
        '==',
        TranscriptionStatus.PROCESSING,
      );
    });

    it('should skip transcriptions still in queue', async () => {
      const mockDocs = [
        {
          id: 'trans-123',
          data: () => ({
            userId: 'user-123',
            fileUrl: 'https://storage.example.com/file.m4a',
            updatedAt: {
              toDate: () => new Date(Date.now() - 10 * 60 * 1000),
            },
          }),
        },
      ];

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValue({ empty: false, size: 1, docs: mockDocs }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(mockCollection);

      // Transcription is still in the queue
      mockQueue.getActive.mockResolvedValue([
        { data: { transcriptionId: 'trans-123' } },
      ]);

      service.onModuleInit();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Should not try to update or add to queue since it's still active
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).not.toHaveBeenCalled();
    });

    it('should skip transcriptions within grace period', async () => {
      const mockDocs = [
        {
          id: 'trans-123',
          data: () => ({
            userId: 'user-123',
            fileUrl: 'https://storage.example.com/file.m4a',
            updatedAt: {
              toDate: () => new Date(), // Just updated now
            },
          }),
        },
      ];

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValue({ empty: false, size: 1, docs: mockDocs }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(mockCollection);

      mockQueue.getActive.mockResolvedValue([]);
      mockQueue.getWaiting.mockResolvedValue([]);
      mockQueue.getDelayed.mockResolvedValue([]);

      service.onModuleInit();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Should not try to recover since it's within grace period
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).not.toHaveBeenCalled();
    });

    it('should recover orphaned transcriptions', async () => {
      const mockDocs = [
        {
          id: 'trans-123',
          data: () => ({
            userId: 'user-123',
            fileUrl: 'https://storage.example.com/file.m4a',
            context: 'Meeting notes',
            selectedTemplates: ['summary', 'action-items'],
            updatedAt: {
              toDate: () => new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
            },
          }),
        },
      ];

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValue({ empty: false, size: 1, docs: mockDocs }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(mockCollection);

      mockQueue.getActive.mockResolvedValue([]);
      mockQueue.getWaiting.mockResolvedValue([]);
      mockQueue.getDelayed.mockResolvedValue([]);

      service.onModuleInit();

      jest.advanceTimersByTime(5000);

      // Need multiple ticks to resolve all promises
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith(
        'trans-123',
        expect.objectContaining({
          status: TranscriptionStatus.PENDING,
        }),
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'transcribe',
        expect.objectContaining({
          transcriptionId: 'trans-123',
          userId: 'user-123',
          fileUrl: 'https://storage.example.com/file.m4a',
        }),
        expect.objectContaining({
          attempts: 3,
        }),
      );
    });

    it('should handle recovery errors gracefully', async () => {
      const mockDocs = [
        {
          id: 'trans-123',
          data: () => ({
            userId: 'user-123',
            fileUrl: 'https://storage.example.com/file.m4a',
            updatedAt: {
              toDate: () => new Date(Date.now() - 10 * 60 * 1000),
            },
          }),
        },
      ];

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValue({ empty: false, size: 1, docs: mockDocs }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(mockCollection);

      mockQueue.getActive.mockResolvedValue([]);
      mockTranscriptionRepository.updateTranscription.mockRejectedValue(
        new Error('Update failed'),
      );

      service.onModuleInit();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Should not throw despite the error
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalled();
    });

    it('should handle missing updatedAt field', async () => {
      const mockDocs = [
        {
          id: 'trans-123',
          data: () => ({
            userId: 'user-123',
            fileUrl: 'https://storage.example.com/file.m4a',
            // No updatedAt field
          }),
        },
      ];

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValue({ empty: false, size: 1, docs: mockDocs }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(mockCollection);

      mockQueue.getActive.mockResolvedValue([]);

      service.onModuleInit();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Should attempt recovery since updatedAt is missing (treated as old)
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalled();
    });

    it('should handle Firestore query errors', async () => {
      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockRejectedValue(new Error('Firestore connection failed')),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(mockCollection);

      service.onModuleInit();

      jest.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();

      // Should not throw despite the error
      expect(mockCollection.get).toHaveBeenCalled();
    });
  });
});
