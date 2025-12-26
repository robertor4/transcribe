import { Test, TestingModule } from '@nestjs/testing';
import { FolderRepository } from './folder.repository';
import { FirebaseService } from '../firebase.service';

describe('FolderRepository', () => {
  let repository: FolderRepository;
  let mockFirebaseService: any;
  let mockDb: any;
  let mockCollection: any;
  let mockDoc: any;
  let mockBatch: any;

  const mockFolderData = {
    userId: 'user123',
    name: 'My Folder',
    color: '#FF5733',
    sortOrder: 0,
    createdAt: { toDate: () => new Date('2024-01-01') },
    updatedAt: { toDate: () => new Date('2024-01-15') },
  };

  beforeEach(async () => {
    mockDoc = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockFolderData,
        id: 'folder123',
      }),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockBatch = {
      update: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc),
      add: jest.fn().mockResolvedValue({ id: 'newFolder123' }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [
          {
            id: 'folder123',
            data: () => mockFolderData,
          },
        ],
      }),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
      batch: jest.fn().mockReturnValue(mockBatch),
    };

    mockFirebaseService = {
      firestore: mockDb,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FolderRepository,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    repository = module.get<FolderRepository>(FolderRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFolder', () => {
    it('should create folder and return ID', async () => {
      const result = await repository.createFolder('user123', {
        name: 'New Folder',
        color: '#FF5733',
      });

      expect(mockDb.collection).toHaveBeenCalledWith('folders');
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          name: 'New Folder',
          color: '#FF5733',
          sortOrder: 0,
        }),
      );
      expect(result).toBe('newFolder123');
    });
  });

  describe('getUserFolders', () => {
    it('should return folders with conversation counts', async () => {
      // Mock parallel queries
      mockCollection.get
        .mockResolvedValueOnce({
          docs: [{ id: 'folder123', data: () => mockFolderData }],
        })
        .mockResolvedValueOnce({
          docs: [
            { data: () => ({ folderId: 'folder123', deletedAt: null }) },
            { data: () => ({ folderId: 'folder123', deletedAt: null }) },
          ],
        });

      const result = await repository.getUserFolders('user123');

      expect(mockCollection.where).toHaveBeenCalledWith(
        'userId',
        '==',
        'user123',
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Folder');
      expect(result[0].conversationCount).toBe(2);
    });
  });

  describe('getFolder', () => {
    it('should return folder by ID', async () => {
      const result = await repository.getFolder('user123', 'folder123');

      expect(mockCollection.doc).toHaveBeenCalledWith('folder123');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('My Folder');
    });

    it('should return null if folder does not exist', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      const result = await repository.getFolder('user123', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return null if userId does not match', async () => {
      const result = await repository.getFolder('wrongUser', 'folder123');

      expect(result).toBeNull();
    });
  });

  describe('updateFolder', () => {
    it('should update folder document', async () => {
      await repository.updateFolder('user123', 'folder123', {
        name: 'Updated Name',
      });

      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          updatedAt: expect.any(Date),
        }),
      );
    });

    it('should throw if folder not found', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      await expect(
        repository.updateFolder('user123', 'nonexistent', { name: 'Test' }),
      ).rejects.toThrow('Folder not found or access denied');
    });
  });

  describe('deleteFolder', () => {
    it('should delete folder and move conversations to unfiled', async () => {
      // Reset and set up specific mocks for this test
      mockCollection.get.mockReset();

      // getTranscriptionsByFolder query
      mockCollection.get.mockResolvedValue({
        docs: [{ id: 'trans1' }, { id: 'trans2' }],
      });

      const result = await repository.deleteFolder('user123', 'folder123');

      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(mockDoc.delete).toHaveBeenCalled();
      expect(result.deletedConversations).toBe(2);
    });

    it('should soft-delete conversations when deleteContents is true', async () => {
      mockCollection.get.mockReset();
      mockCollection.get.mockResolvedValue({
        docs: [{ id: 'trans1' }],
      });

      await repository.deleteFolder('user123', 'folder123', true);

      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          deletedAt: expect.any(Date),
          folderId: null,
        }),
      );
    });
  });
});
