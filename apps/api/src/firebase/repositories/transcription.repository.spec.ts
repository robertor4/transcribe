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
});
