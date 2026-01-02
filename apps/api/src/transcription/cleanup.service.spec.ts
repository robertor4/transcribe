import { Test, TestingModule } from '@nestjs/testing';
import { CleanupService } from './cleanup.service';
import { FirebaseService } from '../firebase/firebase.service';
import { StorageService } from '../firebase/services/storage.service';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { TranscriptionStatus } from '@transcribe/shared';
import {
  createMockFirebaseService,
  createMockStorageService,
  createMockTranscriptionRepository,
} from '../../test/mocks';

describe('CleanupService', () => {
  let service: CleanupService;
  let mockFirebaseService: ReturnType<typeof createMockFirebaseService>;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  let mockTranscriptionRepository: ReturnType<
    typeof createMockTranscriptionRepository
  >;

  // Helper to create mock Firestore document
  const createMockDoc = (
    id: string,
    data: Record<string, any>,
  ): { id: string; data: () => Record<string, any> } => ({
    id,
    data: () => data,
  });

  // Helper to create a timestamp from a date
  const createTimestamp = (date: Date) => ({
    toDate: () => date,
  });

  beforeEach(async () => {
    mockFirebaseService = createMockFirebaseService();
    mockStorageService = createMockStorageService();
    mockTranscriptionRepository = createMockTranscriptionRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: StorageService, useValue: mockStorageService },
        {
          provide: TranscriptionRepository,
          useValue: mockTranscriptionRepository,
        },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCleanup', () => {
    it('should run cleanup tasks', async () => {
      // Setup empty snapshots
      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.handleCleanup();

      expect(mockFirebaseService.firestore.collection).toHaveBeenCalledWith(
        'transcriptions',
      );
    });

    it('should continue if zombie cleanup fails', async () => {
      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      // Should not throw - error is caught and logged
      await expect(service.handleCleanup()).resolves.not.toThrow();
    });
  });

  describe('cleanupZombieTranscriptions (via handleCleanup)', () => {
    it('should not modify transcriptions that are not zombies', async () => {
      const now = Date.now();
      const oneHourAgo = new Date(now - 60 * 60 * 1000);

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValueOnce({
            docs: [
              createMockDoc('recent-pending', {
                status: TranscriptionStatus.PENDING,
                createdAt: createTimestamp(oneHourAgo),
              }),
            ],
          })
          .mockResolvedValueOnce({ docs: [] }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.handleCleanup();

      // Should not update the recent transcription
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).not.toHaveBeenCalled();
    });

    it('should mark zombie PENDING transcriptions as FAILED', async () => {
      const now = Date.now();
      const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000);

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValueOnce({
            docs: [
              createMockDoc('zombie-pending', {
                status: TranscriptionStatus.PENDING,
                createdAt: createTimestamp(twoDaysAgo),
              }),
            ],
          })
          .mockResolvedValueOnce({ docs: [] }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.handleCleanup();

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith('zombie-pending', {
        status: TranscriptionStatus.FAILED,
        error: expect.stringContaining('timed out'),
        updatedAt: expect.any(Date),
      });
    });

    it('should mark zombie PROCESSING transcriptions as FAILED', async () => {
      const now = Date.now();
      const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000);

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValueOnce({ docs: [] })
          .mockResolvedValueOnce({
            docs: [
              createMockDoc('zombie-processing', {
                status: TranscriptionStatus.PROCESSING,
                createdAt: createTimestamp(twoDaysAgo),
              }),
            ],
          }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.handleCleanup();

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith('zombie-processing', {
        status: TranscriptionStatus.FAILED,
        error: expect.stringContaining('timed out'),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle multiple zombie transcriptions', async () => {
      const now = Date.now();
      const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000);

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValueOnce({
            docs: [
              createMockDoc('zombie-1', {
                status: TranscriptionStatus.PENDING,
                createdAt: createTimestamp(twoDaysAgo),
              }),
              createMockDoc('zombie-2', {
                status: TranscriptionStatus.PENDING,
                createdAt: createTimestamp(twoDaysAgo),
              }),
            ],
          })
          .mockResolvedValueOnce({
            docs: [
              createMockDoc('zombie-3', {
                status: TranscriptionStatus.PROCESSING,
                createdAt: createTimestamp(twoDaysAgo),
              }),
            ],
          }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.handleCleanup();

      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledTimes(3);
    });

    it('should handle transcriptions without createdAt timestamp', async () => {
      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValueOnce({
            docs: [
              createMockDoc('no-timestamp', {
                status: TranscriptionStatus.PENDING,
                createdAt: null,
              }),
            ],
          })
          .mockResolvedValueOnce({ docs: [] }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.handleCleanup();

      // Transcription with null createdAt (timestamp 0) is treated as zombie
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledWith('no-timestamp', expect.any(Object));
    });

    it('should continue processing if one update fails', async () => {
      const now = Date.now();
      const twoDaysAgo = new Date(now - 48 * 60 * 60 * 1000);

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValueOnce({
            docs: [
              createMockDoc('zombie-1', {
                status: TranscriptionStatus.PENDING,
                createdAt: createTimestamp(twoDaysAgo),
              }),
              createMockDoc('zombie-2', {
                status: TranscriptionStatus.PENDING,
                createdAt: createTimestamp(twoDaysAgo),
              }),
            ],
          })
          .mockResolvedValueOnce({ docs: [] }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      // First call fails, second succeeds
      mockTranscriptionRepository.updateTranscription
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce(undefined);

      await service.handleCleanup();

      // Both should be attempted
      expect(
        mockTranscriptionRepository.updateTranscription,
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanupOldAudioFiles', () => {
    it('should not delete files for transcriptions within 30 days', async () => {
      const now = Date.now();
      const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);

      const mockCollection = {
        get: jest.fn().mockResolvedValue({
          docs: [
            createMockDoc('recent', {
              storagePath: 'uploads/user/recent.mp3',
              completedAt: createTimestamp(tenDaysAgo),
              status: TranscriptionStatus.COMPLETED,
            }),
          ],
        }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.cleanupOldAudioFiles();

      expect(mockStorageService.deleteFileByPath).not.toHaveBeenCalled();
    });

    it('should delete files for completed transcriptions older than 30 days', async () => {
      const now = Date.now();
      const fortyDaysAgo = new Date(now - 40 * 24 * 60 * 60 * 1000);

      const mockCollection = {
        get: jest.fn().mockResolvedValue({
          docs: [
            createMockDoc('old-completed', {
              storagePath: 'uploads/user/old.mp3',
              completedAt: createTimestamp(fortyDaysAgo),
              status: TranscriptionStatus.COMPLETED,
            }),
          ],
        }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.cleanupOldAudioFiles();

      expect(mockStorageService.deleteFileByPath).toHaveBeenCalledWith(
        'uploads/user/old.mp3',
      );
      expect(
        mockTranscriptionRepository.clearTranscriptionFileReferences,
      ).toHaveBeenCalledWith('old-completed');
    });

    it('should delete files for soft-deleted transcriptions older than 30 days', async () => {
      const now = Date.now();
      const fortyDaysAgo = new Date(now - 40 * 24 * 60 * 60 * 1000);

      const mockCollection = {
        get: jest.fn().mockResolvedValue({
          docs: [
            createMockDoc('soft-deleted', {
              storagePath: 'uploads/user/deleted.mp3',
              deletedAt: createTimestamp(fortyDaysAgo),
            }),
          ],
        }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.cleanupOldAudioFiles();

      expect(mockStorageService.deleteFileByPath).toHaveBeenCalledWith(
        'uploads/user/deleted.mp3',
      );
    });

    it('should delete files for failed transcriptions older than 30 days', async () => {
      const now = Date.now();
      const fortyDaysAgo = new Date(now - 40 * 24 * 60 * 60 * 1000);

      const mockCollection = {
        get: jest.fn().mockResolvedValue({
          docs: [
            createMockDoc('old-failed', {
              storagePath: 'uploads/user/failed.mp3',
              createdAt: createTimestamp(fortyDaysAgo),
              status: TranscriptionStatus.FAILED,
            }),
          ],
        }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.cleanupOldAudioFiles();

      expect(mockStorageService.deleteFileByPath).toHaveBeenCalledWith(
        'uploads/user/failed.mp3',
      );
    });

    it('should skip transcriptions without storagePath', async () => {
      const now = Date.now();
      const fortyDaysAgo = new Date(now - 40 * 24 * 60 * 60 * 1000);

      const mockCollection = {
        get: jest.fn().mockResolvedValue({
          docs: [
            createMockDoc('no-file', {
              storagePath: null,
              completedAt: createTimestamp(fortyDaysAgo),
              status: TranscriptionStatus.COMPLETED,
            }),
          ],
        }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.cleanupOldAudioFiles();

      expect(mockStorageService.deleteFileByPath).not.toHaveBeenCalled();
    });

    it('should continue if file deletion fails', async () => {
      const now = Date.now();
      const fortyDaysAgo = new Date(now - 40 * 24 * 60 * 60 * 1000);

      const mockCollection = {
        get: jest.fn().mockResolvedValue({
          docs: [
            createMockDoc('fail-delete', {
              storagePath: 'uploads/user/error.mp3',
              completedAt: createTimestamp(fortyDaysAgo),
              status: TranscriptionStatus.COMPLETED,
            }),
            createMockDoc('success-delete', {
              storagePath: 'uploads/user/success.mp3',
              completedAt: createTimestamp(fortyDaysAgo),
              status: TranscriptionStatus.COMPLETED,
            }),
          ],
        }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      mockStorageService.deleteFileByPath
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockResolvedValueOnce(undefined);

      await service.cleanupOldAudioFiles();

      // Both deletions should be attempted
      expect(mockStorageService.deleteFileByPath).toHaveBeenCalledTimes(2);
      // Only successful one should clear references
      expect(
        mockTranscriptionRepository.clearTranscriptionFileReferences,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockTranscriptionRepository.clearTranscriptionFileReferences,
      ).toHaveBeenCalledWith('success-delete');
    });

    it('should handle Date strings as well as Firestore timestamps', async () => {
      const now = Date.now();
      const fortyDaysAgo = new Date(now - 40 * 24 * 60 * 60 * 1000);

      const mockCollection = {
        get: jest.fn().mockResolvedValue({
          docs: [
            createMockDoc('date-string', {
              storagePath: 'uploads/user/string.mp3',
              completedAt: fortyDaysAgo.toISOString(), // String instead of Firestore timestamp
              status: TranscriptionStatus.COMPLETED,
            }),
          ],
        }),
      };
      mockFirebaseService.firestore.collection.mockReturnValue(
        mockCollection as any,
      );

      await service.cleanupOldAudioFiles();

      expect(mockStorageService.deleteFileByPath).toHaveBeenCalled();
    });
  });
});
