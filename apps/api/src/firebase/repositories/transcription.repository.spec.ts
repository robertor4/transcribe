import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptionRepository } from './transcription.repository';
import { FirebaseService } from '../firebase.service';
import { FolderRepository } from './folder.repository';

describe('TranscriptionRepository', () => {
  let repository: TranscriptionRepository;
  let mockFirebaseService: any;
  let mockFolderRepository: any;
  let mockDb: any;
  let mockCollection: any;
  let mockDoc: any;

  const mockTranscriptionData = {
    userId: 'user123',
    fileName: 'test-audio.mp3',
    title: 'Test Recording',
    status: 'COMPLETED',
    folderId: 'folder123',
    transcriptText: 'Hello world',
    createdAt: { toDate: () => new Date('2024-01-01') },
    updatedAt: { toDate: () => new Date('2024-01-15') },
    completedAt: { toDate: () => new Date('2024-01-01') },
  };

  beforeEach(async () => {
    mockDoc = {
      exists: true,
      id: 'trans123',
      data: () => mockTranscriptionData,
      get: jest.fn().mockResolvedValue({
        exists: true,
        id: 'trans123',
        data: () => mockTranscriptionData,
      }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(mockDoc),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
      }),
      add: jest.fn().mockResolvedValue({ id: 'newTrans123' }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [mockDoc],
      }),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    mockFirebaseService = {
      firestore: mockDb,
    };

    mockFolderRepository = {
      getFolder: jest.fn().mockResolvedValue({
        id: 'folder123',
        name: 'Test Folder',
        userId: 'user123',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionRepository,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
        {
          provide: FolderRepository,
          useValue: mockFolderRepository,
        },
      ],
    }).compile();

    repository = module.get<TranscriptionRepository>(TranscriptionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTranscription', () => {
    it('should create transcription and return ID', async () => {
      const transcription = {
        userId: 'user123',
        fileName: 'new-audio.mp3',
        fileSize: 1024,
        mimeType: 'audio/mp3',
        status: 'PENDING' as any,
      };

      const result = await repository.createTranscription(transcription as any);

      expect(mockDb.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockCollection.add).toHaveBeenCalledWith(transcription);
      expect(result).toBe('newTrans123');
    });
  });

  describe('updateTranscription', () => {
    it('should update transcription document', async () => {
      await repository.updateTranscription('trans123', { title: 'New Title' });

      expect(mockDb.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockCollection.doc).toHaveBeenCalledWith('trans123');
    });
  });

  describe('getTranscription', () => {
    it('should return transcription by ID', async () => {
      const result = await repository.getTranscription('user123', 'trans123');

      expect(mockCollection.doc).toHaveBeenCalledWith('trans123');
      expect(result).not.toBeNull();
      expect(result?.fileName).toBe('test-audio.mp3');
    });

    it('should return null if transcription does not exist', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });

      const result = await repository.getTranscription(
        'user123',
        'nonexistent',
      );

      expect(result).toBeNull();
    });

    it('should return null if userId does not match', async () => {
      const result = await repository.getTranscription('wrongUser', 'trans123');

      expect(result).toBeNull();
    });
  });

  describe('getTranscriptions', () => {
    it('should return paginated transcriptions', async () => {
      const result = await repository.getTranscriptions('user123', 1, 10);

      expect(mockCollection.where).toHaveBeenCalledWith(
        'userId',
        '==',
        'user123',
      );
      expect(mockCollection.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should filter out soft-deleted items', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          mockDoc,
          {
            id: 'deleted123',
            data: () => ({ ...mockTranscriptionData, deletedAt: new Date() }),
          },
        ],
      });

      const result = await repository.getTranscriptions('user123', 1, 10);

      expect(result.items).toHaveLength(1);
    });
  });

  describe('searchTranscriptions', () => {
    it('should search transcriptions by query', async () => {
      const result = await repository.searchTranscriptions(
        'user123',
        'test',
        20,
      );

      expect(mockCollection.where).toHaveBeenCalledWith(
        'userId',
        '==',
        'user123',
      );
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('recordTranscriptionAccess', () => {
    it('should update lastAccessedAt timestamp', async () => {
      await repository.recordTranscriptionAccess('user123', 'trans123');

      expect(mockCollection.doc).toHaveBeenCalledWith('trans123');
    });

    it('should throw if transcription not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      });

      await expect(
        repository.recordTranscriptionAccess('user123', 'nonexistent'),
      ).rejects.toThrow('Transcription not found');
    });
  });

  describe('getRecentlyOpenedTranscriptions', () => {
    it('should return recently accessed transcriptions', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans123',
            data: () => ({
              ...mockTranscriptionData,
              lastAccessedAt: { toDate: () => new Date() },
            }),
          },
        ],
      });

      const result = await repository.getRecentlyOpenedTranscriptions(
        'user123',
        5,
      );

      expect(mockCollection.orderBy).toHaveBeenCalledWith(
        'lastAccessedAt',
        'desc',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteTranscription', () => {
    it('should delete transcription document', async () => {
      await repository.deleteTranscription('trans123');

      expect(mockCollection.doc).toHaveBeenCalledWith('trans123');
    });
  });

  describe('getTranscriptionByShareToken', () => {
    it('should return transcription by share token', async () => {
      const result = await repository.getTranscriptionByShareToken('abc123');

      expect(mockCollection.where).toHaveBeenCalledWith(
        'shareToken',
        '==',
        'abc123',
      );
      expect(result).not.toBeNull();
    });

    it('should return null if no matching share token', async () => {
      mockCollection.get.mockResolvedValue({ empty: true, docs: [] });

      const result =
        await repository.getTranscriptionByShareToken('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTranscriptionsByFolder', () => {
    it('should return transcriptions in a folder', async () => {
      const result = await repository.getTranscriptionsByFolder(
        'user123',
        'folder123',
      );

      expect(mockCollection.where).toHaveBeenCalledWith(
        'folderId',
        '==',
        'folder123',
      );
      expect(result).toHaveLength(1);
    });

    it('should return unfiled transcriptions when folderId is null', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            data: () => ({ ...mockTranscriptionData, folderId: null }),
          },
        ],
      });

      const result = await repository.getTranscriptionsByFolder(
        'user123',
        null,
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('moveToFolder', () => {
    it('should move transcription to a folder', async () => {
      await repository.moveToFolder('user123', 'trans123', 'folder123');

      expect(mockFolderRepository.getFolder).toHaveBeenCalledWith(
        'user123',
        'folder123',
      );
    });

    it('should throw if transcription not found', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
        update: jest.fn(),
      });

      await expect(
        repository.moveToFolder('user123', 'nonexistent', 'folder123'),
      ).rejects.toThrow('Transcription not found or access denied');
    });

    it('should throw if folder not found', async () => {
      mockFolderRepository.getFolder.mockResolvedValue(null);

      await expect(
        repository.moveToFolder('user123', 'trans123', 'nonexistent'),
      ).rejects.toThrow('Folder not found or access denied');
    });

    it('should allow removing from folder with null folderId', async () => {
      await repository.moveToFolder('user123', 'trans123', null);

      expect(mockFolderRepository.getFolder).not.toHaveBeenCalled();
    });
  });

  describe('deleteShareInfo', () => {
    it('should delete share fields from transcription', async () => {
      await repository.deleteShareInfo('trans123');

      expect(mockCollection.doc).toHaveBeenCalledWith('trans123');
    });
  });

  describe('clearTranscriptionFileReferences', () => {
    it('should clear file references', async () => {
      await repository.clearTranscriptionFileReferences('trans123');

      expect(mockCollection.doc).toHaveBeenCalledWith('trans123');
    });
  });

  describe('getTranscriptions edge cases', () => {
    it('should fetch all records when initial fetch has too many deleted items', async () => {
      // For page=1, pageSize=10: offset=0, fetchLimit=20 (pageSize*2)
      // Condition: allDocs.length < offset + pageSize (i.e., less than 10 non-deleted)
      //            AND snapshot.docs.length === fetchLimit (i.e., exactly 20 docs fetched)

      // Create exactly 20 docs where only 5 are non-deleted (less than pageSize=10)
      const firstFetchDocs = [
        ...Array.from({ length: 15 }, (_, i) => ({
          id: `deleted${i}`,
          data: () => ({
            ...mockTranscriptionData,
            deletedAt: new Date(),
          }),
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `trans${i}`,
          data: () => mockTranscriptionData,
        })),
      ];

      // Second call returns all records including more non-deleted ones
      const allDocs = [
        ...Array.from({ length: 12 }, (_, i) => ({
          id: `trans${i}`,
          data: () => mockTranscriptionData,
        })),
      ];

      mockCollection.get
        .mockResolvedValueOnce({
          docs: firstFetchDocs,
        })
        .mockResolvedValueOnce({
          docs: allDocs,
        });

      const result = await repository.getTranscriptions('user123', 1, 10);

      // Should have fetched again after seeing too many deleted
      expect(mockCollection.get).toHaveBeenCalledTimes(2);
      expect(result.items.length).toBe(10);
    });
  });

  describe('searchTranscriptions edge cases', () => {
    it('should search in summaryV2 headline', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            data: () => ({
              ...mockTranscriptionData,
              summaryV2: {
                headline: 'Important Meeting Headline',
              },
            }),
          },
        ],
      });

      const result = await repository.searchTranscriptions(
        'user123',
        'headline',
        20,
      );

      expect(result.total).toBe(1);
    });

    it('should search in summaryV2 keyPoints', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            data: () => ({
              ...mockTranscriptionData,
              summaryV2: {
                keyPoints: [
                  {
                    topic: 'Budget Planning',
                    description: 'Discussed quarterly budget',
                  },
                ],
              },
            }),
          },
        ],
      });

      const result = await repository.searchTranscriptions(
        'user123',
        'budget',
        20,
      );

      expect(result.total).toBe(1);
    });

    it('should search in summaryV2 themes', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            data: () => ({
              ...mockTranscriptionData,
              summaryV2: {
                themes: ['Strategy', 'Innovation', 'Growth'],
              },
            }),
          },
        ],
      });

      const result = await repository.searchTranscriptions(
        'user123',
        'innovation',
        20,
      );

      expect(result.total).toBe(1);
    });

    it('should search in legacy coreAnalyses.summaryV2', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            data: () => ({
              ...mockTranscriptionData,
              coreAnalyses: {
                summaryV2: {
                  headline: 'Legacy Headline',
                  keyPoints: [
                    { topic: 'Legacy Topic', description: 'Description' },
                  ],
                },
              },
            }),
          },
        ],
      });

      const result = await repository.searchTranscriptions(
        'user123',
        'legacy',
        20,
      );

      expect(result.total).toBe(1);
    });

    it('should exclude soft-deleted items from search', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            data: () => ({
              ...mockTranscriptionData,
              deletedAt: new Date(),
            }),
          },
        ],
      });

      const result = await repository.searchTranscriptions(
        'user123',
        'test',
        20,
      );

      expect(result.total).toBe(0);
    });
  });

  describe('recordTranscriptionAccess edge cases', () => {
    it('should throw if userId does not match', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ ...mockTranscriptionData, userId: 'differentUser' }),
        }),
        update: jest.fn(),
      });

      await expect(
        repository.recordTranscriptionAccess('user123', 'trans123'),
      ).rejects.toThrow('Transcription not found');
    });
  });

  describe('clearRecentlyOpened', () => {
    it('should return 0 when no transcriptions have lastAccessedAt', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            ref: { id: 'trans1' },
            data: () => ({
              ...mockTranscriptionData,
              lastAccessedAt: undefined,
            }),
          },
        ],
      });

      const result = await repository.clearRecentlyOpened('user123');

      expect(result).toBe(0);
    });

    it('should batch clear lastAccessedAt from transcriptions', async () => {
      const docsWithAccess = Array.from({ length: 3 }, (_, i) => ({
        id: `trans${i}`,
        ref: { id: `trans${i}` },
        data: () => ({
          ...mockTranscriptionData,
          lastAccessedAt: { toDate: () => new Date() },
        }),
      }));

      mockCollection.get.mockResolvedValue({
        docs: docsWithAccess,
      });

      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockDb.batch = jest.fn().mockReturnValue(mockBatch);

      const result = await repository.clearRecentlyOpened('user123');

      expect(result).toBe(3);
      expect(mockBatch.update).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle large batches (over 500 items)', async () => {
      const docsWithAccess = Array.from({ length: 600 }, (_, i) => ({
        id: `trans${i}`,
        ref: { id: `trans${i}` },
        data: () => ({
          ...mockTranscriptionData,
          lastAccessedAt: { toDate: () => new Date() },
        }),
      }));

      mockCollection.get.mockResolvedValue({
        docs: docsWithAccess,
      });

      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockDb.batch = jest.fn().mockReturnValue(mockBatch);

      const result = await repository.clearRecentlyOpened('user123');

      expect(result).toBe(600);
      // Should have committed twice (500 + 100)
      expect(mockBatch.commit).toHaveBeenCalledTimes(2);
    });

    it('should not clear deleted transcriptions', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            ref: { id: 'trans1' },
            data: () => ({
              ...mockTranscriptionData,
              lastAccessedAt: { toDate: () => new Date() },
              deletedAt: new Date(),
            }),
          },
        ],
      });

      const result = await repository.clearRecentlyOpened('user123');

      expect(result).toBe(0);
    });
  });

  describe('mapTranscriptionData', () => {
    it('should map sharedWith records with proper date conversion', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'trans123',
          data: () => ({
            ...mockTranscriptionData,
            sharedWith: [
              {
                email: 'test@example.com',
                sentAt: { toDate: () => new Date('2024-01-15') },
              },
              { email: 'test2@example.com', sentAt: new Date('2024-01-16') },
            ],
          }),
        }),
      });

      const result = await repository.getTranscription('user123', 'trans123');

      expect(result?.sharedWith).toHaveLength(2);
      expect(result?.sharedWith?.[0].email).toBe('test@example.com');
    });

    it('should handle sharedAt date conversion', async () => {
      mockCollection.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'trans123',
          data: () => ({
            ...mockTranscriptionData,
            sharedAt: { toDate: () => new Date('2024-01-20') },
          }),
        }),
      });

      const result = await repository.getTranscription('user123', 'trans123');

      expect(result?.sharedAt).toBeInstanceOf(Date);
    });
  });

  describe('getRecentlyOpenedTranscriptions edge cases', () => {
    it('should filter out transcriptions without lastAccessedAt', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            data: () => ({
              ...mockTranscriptionData,
              lastAccessedAt: { toDate: () => new Date() },
            }),
          },
          {
            id: 'trans2',
            data: () => ({
              ...mockTranscriptionData,
              lastAccessedAt: undefined,
            }),
          },
        ],
      });

      const result = await repository.getRecentlyOpenedTranscriptions(
        'user123',
        5,
      );

      expect(result).toHaveLength(1);
    });

    it('should filter out soft-deleted transcriptions', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          {
            id: 'trans1',
            data: () => ({
              ...mockTranscriptionData,
              lastAccessedAt: { toDate: () => new Date() },
              deletedAt: new Date(),
            }),
          },
        ],
      });

      const result = await repository.getRecentlyOpenedTranscriptions(
        'user123',
        5,
      );

      expect(result).toHaveLength(0);
    });
  });
});
