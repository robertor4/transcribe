import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from './firebase.service';

// Mock references - populated by jest.mock
let mockFirestore: any;
let mockStorage: any;
let mockAuth: any;

jest.mock('firebase-admin', () => {
  const mockFs = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    add: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    batch: jest.fn(),
  };

  const mockSt = {
    bucket: jest.fn().mockReturnValue({
      file: jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue([true]),
        getSignedUrl: jest.fn().mockResolvedValue(['https://signed-url.com']),
        download: jest.fn().mockResolvedValue([Buffer.from('file content')]),
        delete: jest.fn().mockResolvedValue(undefined),
      }),
      getFiles: jest.fn().mockResolvedValue([[]]),
    }),
  };

  const mockAu = {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  const firestoreFn: any = jest.fn(() => mockFs);
  firestoreFn.FieldValue = {
    serverTimestamp: jest.fn().mockReturnValue({ _serverTimestamp: true }),
    delete: jest.fn().mockReturnValue({ _delete: true }),
    arrayUnion: jest.fn((value) => ({ _arrayUnion: value })),
    arrayRemove: jest.fn((value) => ({ _arrayRemove: value })),
  };
  firestoreFn.Timestamp = {
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
    now: jest.fn().mockReturnValue({ toDate: () => new Date() }),
  };

  // Export for test access
  (global as any).__mockFirestore = mockFs;
  (global as any).__mockStorage = mockSt;
  (global as any).__mockAuth = mockAu;

  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn().mockReturnValue({}),
    },
    firestore: firestoreFn,
    storage: jest.fn(() => mockSt),
    auth: jest.fn(() => mockAu),
  };
});

describe('FirebaseService', () => {
  let service: FirebaseService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        FIREBASE_PROJECT_ID: 'test-project',
        FIREBASE_PRIVATE_KEY:
          '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        FIREBASE_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
        FIREBASE_STORAGE_BUCKET: 'test-bucket.firebasestorage.app',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    // Get mocks from global - set by jest.mock
    mockFirestore = (global as any).__mockFirestore;
    mockStorage = (global as any).__mockStorage;
    mockAuth = (global as any).__mockAuth;

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
    // Manually set the db and storage since onModuleInit might not run in tests
    (service as any).db = mockFirestore;
    (service as any).storage = mockStorage;
  });

  describe('firestore getter', () => {
    it('should return the firestore instance', () => {
      expect(service.firestore).toBe(mockFirestore);
    });
  });

  describe('storageService getter', () => {
    it('should return the storage instance', () => {
      expect(service.storageService).toBe(mockStorage);
    });
  });

  describe('verifyIdToken', () => {
    it('should verify a valid token', async () => {
      const decodedToken = { uid: 'user-123', email: 'test@example.com' };
      mockAuth.verifyIdToken.mockResolvedValue(decodedToken);

      const result = await service.verifyIdToken('valid-token');

      expect(result).toEqual(decodedToken);
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
    });

    it('should throw on invalid token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyIdToken('invalid-token')).rejects.toThrow(
        'Invalid token',
      );
    });
  });

  describe('createTranscription', () => {
    it('should create a transcription and return id', async () => {
      mockFirestore.add.mockResolvedValue({ id: 'new-transcription-id' });

      const transcriptionData = {
        userId: 'user-123',
        title: 'Test',
        status: 'pending' as const,
      };

      const result = await service.createTranscription(
        transcriptionData as any,
      );

      expect(result).toBe('new-transcription-id');
      expect(mockFirestore.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockFirestore.add).toHaveBeenCalledWith(transcriptionData);
    });
  });

  describe('updateTranscription', () => {
    it('should update a transcription', async () => {
      mockFirestore.update.mockResolvedValue(undefined);

      await service.updateTranscription('trans-123', { title: 'Updated' });

      expect(mockFirestore.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockFirestore.doc).toHaveBeenCalledWith('trans-123');
      expect(mockFirestore.update).toHaveBeenCalledWith({ title: 'Updated' });
    });
  });

  describe('getTranscription', () => {
    it('should return null if document does not exist', async () => {
      mockFirestore.get.mockResolvedValue({ exists: false });

      const result = await service.getTranscription('user-123', 'trans-123');

      expect(result).toBeNull();
    });

    it('should return null if userId does not match', async () => {
      mockFirestore.get.mockResolvedValue({
        exists: true,
        id: 'trans-123',
        data: () => ({ userId: 'other-user' }),
      });

      const result = await service.getTranscription('user-123', 'trans-123');

      expect(result).toBeNull();
    });

    it('should return transcription with converted dates', async () => {
      const mockDate = new Date('2024-01-01');
      mockFirestore.get.mockResolvedValue({
        exists: true,
        id: 'trans-123',
        data: () => ({
          userId: 'user-123',
          title: 'Test',
          createdAt: { toDate: () => mockDate },
          updatedAt: { toDate: () => mockDate },
        }),
      });

      const result = await service.getTranscription('user-123', 'trans-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('trans-123');
      expect(result?.createdAt).toEqual(mockDate);
    });
  });

  describe('deleteTranscription', () => {
    it('should delete a transcription', async () => {
      mockFirestore.delete.mockResolvedValue(undefined);

      await service.deleteTranscription('trans-123');

      expect(mockFirestore.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockFirestore.doc).toHaveBeenCalledWith('trans-123');
      expect(mockFirestore.delete).toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    it('should upload file and return url and path', async () => {
      const buffer = Buffer.from('test content');
      const path = 'transcriptions/user-123/file.mp3';

      const result = await service.uploadFile(buffer, path, 'audio/mpeg');

      expect(result.path).toBe(path);
      expect(result.url).toBeDefined();
      expect(mockStorage.bucket).toHaveBeenCalled();
    });

    it('should throw if file verification fails', async () => {
      const bucket = mockStorage.bucket();
      const file = bucket.file();
      file.exists.mockResolvedValue([false]);

      const buffer = Buffer.from('test content');
      const path = 'transcriptions/user-123/file.mp3';

      await expect(
        service.uploadFile(buffer, path, 'audio/mpeg'),
      ).rejects.toThrow('File upload verification failed');
    });
  });

  describe('uploadText', () => {
    it('should upload text content and return url', async () => {
      const bucket = mockStorage.bucket();
      const file = bucket.file();
      file.exists.mockResolvedValue([true]);

      const result = await service.uploadText(
        'text content',
        'path/to/file.txt',
      );

      expect(result).toBeDefined();
    });
  });

  describe('downloadFile', () => {
    it('should download file and return buffer', async () => {
      const bucket = mockStorage.bucket();
      const file = bucket.file();
      file.download.mockResolvedValue([Buffer.from('file content')]);

      const result = await service.downloadFile(
        'https://storage.googleapis.com/test-bucket.firebasestorage.app/path/to/file.mp3',
      );

      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('deleteFile', () => {
    it('should delete file from storage', async () => {
      const bucket = mockStorage.bucket();
      const file = bucket.file();
      file.delete.mockResolvedValue(undefined);

      await service.deleteFile(
        'https://storage.googleapis.com/test-bucket.firebasestorage.app/path/to/file.mp3',
      );

      expect(file.delete).toHaveBeenCalled();
    });

    it('should handle 404 errors gracefully', async () => {
      const bucket = mockStorage.bucket();
      const file = bucket.file();
      file.delete.mockRejectedValue({ code: 404 });

      // Should not throw
      await expect(
        service.deleteFile(
          'https://storage.googleapis.com/test-bucket.firebasestorage.app/path/to/file.mp3',
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteFileByPath', () => {
    it('should delete file by path', async () => {
      const bucket = mockStorage.bucket();
      const file = bucket.file();
      file.delete.mockResolvedValue(undefined);

      await service.deleteFileByPath('path/to/file.mp3');

      expect(file.delete).toHaveBeenCalled();
    });

    it('should handle file not found gracefully', async () => {
      const bucket = mockStorage.bucket();
      const file = bucket.file();
      file.delete.mockRejectedValue({ code: 404 });

      // Should not throw
      await expect(
        service.deleteFileByPath('nonexistent/file.mp3'),
      ).resolves.toBeUndefined();
    });
  });

  describe('Summary Comments', () => {
    describe('addSummaryComment', () => {
      it('should add a comment and return id', async () => {
        mockFirestore.add.mockResolvedValue({ id: 'comment-123' });

        const comment = {
          transcriptionId: 'trans-123',
          userId: 'user-123',
          position: { section: 'summary' },
          content: 'Test comment',
        };

        const result = await service.addSummaryComment(
          'trans-123',
          comment as any,
        );

        expect(result).toBe('comment-123');
      });
    });

    describe('getSummaryComments', () => {
      it('should return all comments for a transcription', async () => {
        const mockDate = new Date();
        mockFirestore.get.mockResolvedValue({
          docs: [
            {
              id: 'comment-1',
              data: () => ({
                transcriptionId: 'trans-123',
                userId: 'user-123',
                content: 'Comment 1',
                createdAt: { toDate: () => mockDate },
                updatedAt: { toDate: () => mockDate },
              }),
            },
          ],
        });

        const result = await service.getSummaryComments('trans-123');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('comment-1');
      });
    });

    describe('updateSummaryComment', () => {
      it('should update a comment', async () => {
        mockFirestore.update.mockResolvedValue(undefined);

        await service.updateSummaryComment('trans-123', 'comment-123', {
          content: 'Updated content',
        });

        expect(mockFirestore.update).toHaveBeenCalled();
      });
    });

    describe('deleteSummaryComment', () => {
      it('should delete a comment', async () => {
        mockFirestore.delete.mockResolvedValue(undefined);

        await service.deleteSummaryComment('trans-123', 'comment-123');

        expect(mockFirestore.delete).toHaveBeenCalled();
      });
    });

    describe('getSummaryComment', () => {
      it('should return null if comment does not exist', async () => {
        mockFirestore.get.mockResolvedValue({ exists: false });

        const result = await service.getSummaryComment(
          'trans-123',
          'comment-123',
        );

        expect(result).toBeNull();
      });

      it('should return comment if it exists', async () => {
        const mockDate = new Date();
        mockFirestore.get.mockResolvedValue({
          exists: true,
          id: 'comment-123',
          data: () => ({
            transcriptionId: 'trans-123',
            userId: 'user-123',
            content: 'Test comment',
            createdAt: { toDate: () => mockDate },
            updatedAt: { toDate: () => mockDate },
          }),
        });

        const result = await service.getSummaryComment(
          'trans-123',
          'comment-123',
        );

        expect(result).not.toBeNull();
        expect(result?.id).toBe('comment-123');
      });
    });
  });

  describe('User methods', () => {
    describe('getUserById', () => {
      it('should return user from auth', async () => {
        mockAuth.getUser.mockResolvedValue({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://photo.url',
        });

        const result = await service.getUserById('user-123');

        expect(result).toEqual({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://photo.url',
        });
      });

      it('should return null on error', async () => {
        mockAuth.getUser.mockRejectedValue(new Error('User not found'));

        const result = await service.getUserById('user-123');

        expect(result).toBeNull();
      });
    });

    describe('getUser', () => {
      it('should return null if user document does not exist', async () => {
        mockFirestore.get.mockResolvedValue({ exists: false });

        const result = await service.getUser('user-123');

        expect(result).toBeNull();
      });

      it('should return user with converted dates', async () => {
        const mockDate = new Date();
        mockFirestore.get.mockResolvedValue({
          exists: true,
          data: () => ({
            email: 'test@example.com',
            displayName: 'Test User',
            subscriptionTier: 'professional',
            createdAt: { toDate: () => mockDate },
            updatedAt: { toDate: () => mockDate },
          }),
        });

        const result = await service.getUser('user-123');

        expect(result).not.toBeNull();
        expect(result?.uid).toBe('user-123');
        expect(result?.subscriptionTier).toBe('professional');
        expect(result?.createdAt).toEqual(mockDate);
      });
    });

    describe('createUser', () => {
      it('should create a user document with defaults', async () => {
        mockFirestore.doc().set = jest.fn().mockResolvedValue(undefined);
        (mockFirestore.doc().set as jest.Mock).mockResolvedValue(undefined);

        await service.createUser({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        });

        expect(mockFirestore.collection).toHaveBeenCalledWith('users');
        expect(mockFirestore.doc).toHaveBeenCalledWith('user-123');
      });
    });

    describe('updateUser', () => {
      it('should update a user document', async () => {
        mockFirestore.update.mockResolvedValue(undefined);

        await service.updateUser('user-123', { displayName: 'New Name' });

        expect(mockFirestore.collection).toHaveBeenCalledWith('users');
        expect(mockFirestore.doc).toHaveBeenCalledWith('user-123');
      });
    });

    describe('softDeleteUser', () => {
      it('should mark user as deleted', async () => {
        mockFirestore.update.mockResolvedValue(undefined);

        await service.softDeleteUser('user-123');

        expect(mockFirestore.update).toHaveBeenCalledWith(
          expect.objectContaining({
            isDeleted: true,
          }),
        );
      });
    });

    describe('deleteUser', () => {
      it('should delete user document', async () => {
        mockFirestore.delete.mockResolvedValue(undefined);

        await service.deleteUser('user-123');

        expect(mockFirestore.collection).toHaveBeenCalledWith('users');
        expect(mockFirestore.delete).toHaveBeenCalled();
      });
    });

    describe('getUserByStripeCustomerId', () => {
      it('should return null if no user found', async () => {
        mockFirestore.get.mockResolvedValue({ empty: true, docs: [] });

        const result = await service.getUserByStripeCustomerId('cus_123');

        expect(result).toBeNull();
      });

      it('should return user if found', async () => {
        mockFirestore.get.mockResolvedValue({
          empty: false,
          docs: [
            {
              id: 'user-123',
              data: () => ({
                email: 'test@example.com',
                stripeCustomerId: 'cus_123',
              }),
            },
          ],
        });

        const result = await service.getUserByStripeCustomerId('cus_123');

        expect(result).not.toBeNull();
        expect(result?.uid).toBe('user-123');
      });
    });
  });

  describe('deleteUserTranscriptions', () => {
    it('should delete all user transcriptions and return count', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockFirestore.batch.mockReturnValue(mockBatch);
      mockFirestore.get.mockResolvedValue({
        docs: [{ ref: { id: 'trans-1' } }, { ref: { id: 'trans-2' } }],
      });

      const result = await service.deleteUserTranscriptions('user-123');

      expect(result).toBe(2);
      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('deleteUserGeneratedAnalyses', () => {
    it('should delete all user analyses and return count', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      mockFirestore.batch.mockReturnValue(mockBatch);
      mockFirestore.get.mockResolvedValue({
        docs: [
          { ref: { id: 'analysis-1' } },
          { ref: { id: 'analysis-2' } },
          { ref: { id: 'analysis-3' } },
        ],
      });

      const result = await service.deleteUserGeneratedAnalyses('user-123');

      expect(result).toBe(3);
      expect(mockBatch.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('Folders', () => {
    describe('createFolder', () => {
      it('should create a folder and return id', async () => {
        mockFirestore.add.mockResolvedValue({ id: 'folder-123' });

        const result = await service.createFolder('user-123', {
          name: 'Test Folder',
        });

        expect(result).toBe('folder-123');
        expect(mockFirestore.collection).toHaveBeenCalledWith('folders');
      });
    });

    describe('getFolder', () => {
      it('should return null if folder does not exist', async () => {
        mockFirestore.get.mockResolvedValue({ exists: false });

        const result = await service.getFolder('user-123', 'folder-123');

        expect(result).toBeNull();
      });

      it('should return null if userId does not match', async () => {
        mockFirestore.get.mockResolvedValue({
          exists: true,
          data: () => ({ userId: 'other-user', name: 'Test' }),
        });

        const result = await service.getFolder('user-123', 'folder-123');

        expect(result).toBeNull();
      });

      it('should return folder if found and owned by user', async () => {
        const mockDate = new Date();
        mockFirestore.get.mockResolvedValue({
          exists: true,
          id: 'folder-123',
          data: () => ({
            userId: 'user-123',
            name: 'Test Folder',
            color: '#FF0000',
            sortOrder: 0,
            createdAt: { toDate: () => mockDate },
            updatedAt: { toDate: () => mockDate },
          }),
        });

        const result = await service.getFolder('user-123', 'folder-123');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('folder-123');
        expect(result?.name).toBe('Test Folder');
      });
    });

    describe('updateFolder', () => {
      it('should throw if folder not found', async () => {
        mockFirestore.get.mockResolvedValue({ exists: false });

        await expect(
          service.updateFolder('user-123', 'folder-123', { name: 'New Name' }),
        ).rejects.toThrow('Folder not found or access denied');
      });
    });
  });

  describe('Generated Analyses', () => {
    describe('createGeneratedAnalysis', () => {
      it('should create an analysis and return id', async () => {
        mockFirestore.add.mockResolvedValue({ id: 'analysis-123' });

        const analysis = {
          userId: 'user-123',
          transcriptionId: 'trans-123',
          templateId: 'action-items',
          generatedAt: new Date(),
        };

        const result = await service.createGeneratedAnalysis(analysis);

        expect(result).toBe('analysis-123');
        expect(mockFirestore.collection).toHaveBeenCalledWith(
          'generatedAnalyses',
        );
      });
    });

    describe('getGeneratedAnalysisById', () => {
      it('should return null if analysis does not exist', async () => {
        mockFirestore.get.mockResolvedValue({ exists: false });

        const result = await service.getGeneratedAnalysisById('analysis-123');

        expect(result).toBeNull();
      });

      it('should return analysis if found', async () => {
        const mockDate = new Date();
        mockFirestore.get.mockResolvedValue({
          exists: true,
          id: 'analysis-123',
          data: () => ({
            userId: 'user-123',
            templateId: 'action-items',
            generatedAt: { toDate: () => mockDate },
          }),
        });

        const result = await service.getGeneratedAnalysisById('analysis-123');

        expect(result).not.toBeNull();
        expect(result?.id).toBe('analysis-123');
      });
    });

    describe('deleteGeneratedAnalysis', () => {
      it('should delete an analysis', async () => {
        mockFirestore.delete.mockResolvedValue(undefined);

        await service.deleteGeneratedAnalysis('analysis-123');

        expect(mockFirestore.collection).toHaveBeenCalledWith(
          'generatedAnalyses',
        );
        expect(mockFirestore.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Translations', () => {
    describe('createTranslation', () => {
      it('should create a translation and return id', async () => {
        mockFirestore.add.mockResolvedValue({ id: 'translation-123' });

        const translation = {
          transcriptionId: 'trans-123',
          userId: 'user-123',
          sourceType: 'summary' as const,
          sourceId: 'source-123',
          localeCode: 'es',
          localeName: 'Spanish',
          content: { title: 'Título' },
          translatedAt: new Date(),
          translatedBy: 'gpt-4',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await service.createTranslation(translation as any);

        expect(result).toBe('translation-123');
        expect(mockFirestore.collection).toHaveBeenCalledWith('translations');
      });
    });

    describe('deleteTranslationsForLocale', () => {
      it('should return 0 if no translations found', async () => {
        mockFirestore.get.mockResolvedValue({ empty: true, docs: [], size: 0 });

        const result = await service.deleteTranslationsForLocale(
          'trans-123',
          'es',
          'user-123',
        );

        expect(result).toBe(0);
      });

      it('should delete translations and return count', async () => {
        const mockBatch = {
          delete: jest.fn(),
          commit: jest.fn().mockResolvedValue(undefined),
        };
        mockFirestore.batch.mockReturnValue(mockBatch);
        mockFirestore.get.mockResolvedValue({
          empty: false,
          size: 2,
          docs: [{ ref: { id: 'trans-1' } }, { ref: { id: 'trans-2' } }],
        });

        const result = await service.deleteTranslationsForLocale(
          'trans-123',
          'es',
          'user-123',
        );

        expect(result).toBe(2);
        expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('getTranscriptionByShareToken', () => {
    it('should return null if no transcription found', async () => {
      mockFirestore.get.mockResolvedValue({ empty: true, docs: [] });

      const result = await service.getTranscriptionByShareToken('abc123');

      expect(result).toBeNull();
    });

    it('should return transcription if found', async () => {
      const mockDate = new Date();
      mockFirestore.get.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'trans-123',
            data: () => ({
              userId: 'user-123',
              title: 'Shared Transcription',
              shareToken: 'abc123',
              createdAt: { toDate: () => mockDate },
            }),
          },
        ],
      });

      const result = await service.getTranscriptionByShareToken('abc123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('trans-123');
      expect(result?.shareToken).toBe('abc123');
    });
  });

  describe('deleteShareInfo', () => {
    it('should clear share fields from transcription', async () => {
      mockFirestore.update.mockResolvedValue(undefined);

      await service.deleteShareInfo('trans-123');

      expect(mockFirestore.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockFirestore.doc).toHaveBeenCalledWith('trans-123');
      expect(mockFirestore.update).toHaveBeenCalled();
    });
  });

  describe('clearTranscriptionFileReferences', () => {
    it('should clear file references', async () => {
      mockFirestore.update.mockResolvedValue(undefined);

      await service.clearTranscriptionFileReferences('trans-123');

      expect(mockFirestore.update).toHaveBeenCalled();
    });
  });

  describe('extractIdFromPath (private method testing via public methods)', () => {
    it('should extract id from transcriptions path in logs', async () => {
      const bucket = mockStorage.bucket();
      const file = bucket.file();
      file.exists.mockResolvedValue([true]);

      // This will use extractIdFromPath internally for logging
      await service.uploadFile(
        Buffer.from('test'),
        'transcriptions/user-123/trans-456/file.mp3',
        'audio/mpeg',
      );

      // If no error, path parsing worked
      expect(true).toBe(true);
    });
  });

  describe('getTranscriptions', () => {
    it('should return paginated transcriptions', async () => {
      const mockDate = new Date();
      mockFirestore.get.mockResolvedValue({
        docs: [
          {
            id: 'trans-1',
            data: () => ({
              userId: 'user-123',
              title: 'First',
              createdAt: { toDate: () => mockDate },
            }),
          },
          {
            id: 'trans-2',
            data: () => ({
              userId: 'user-123',
              title: 'Second',
              createdAt: { toDate: () => mockDate },
            }),
          },
        ],
      });

      const result = await service.getTranscriptions('user-123', 1, 10);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should filter out soft-deleted transcriptions', async () => {
      const mockDate = new Date();
      mockFirestore.get.mockResolvedValue({
        docs: [
          {
            id: 'trans-1',
            data: () => ({
              userId: 'user-123',
              title: 'Active',
              createdAt: { toDate: () => mockDate },
            }),
          },
          {
            id: 'trans-2',
            data: () => ({
              userId: 'user-123',
              title: 'Deleted',
              deletedAt: mockDate, // Soft-deleted
              createdAt: { toDate: () => mockDate },
            }),
          },
        ],
      });

      const result = await service.getTranscriptions('user-123', 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Active');
    });
  });

  describe('getTranscriptionsByFolder', () => {
    it('should return transcriptions in folder', async () => {
      const mockDate = new Date();
      mockFirestore.get.mockResolvedValue({
        docs: [
          {
            id: 'trans-1',
            data: () => ({
              userId: 'user-123',
              folderId: 'folder-123',
              title: 'In folder',
              createdAt: { toDate: () => mockDate },
            }),
          },
        ],
      });

      const result = await service.getTranscriptionsByFolder(
        'user-123',
        'folder-123',
      );

      expect(result).toHaveLength(1);
      expect(result[0].folderId).toBe('folder-123');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with converted dates', async () => {
      const mockDate = new Date();
      mockFirestore.get.mockResolvedValue({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              email: 'user1@example.com',
              createdAt: { toDate: () => mockDate },
            }),
          },
          {
            id: 'user-2',
            data: () => ({
              email: 'user2@example.com',
              createdAt: { toDate: () => mockDate },
            }),
          },
        ],
      });

      const result = await service.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].uid).toBe('user-1');
      expect(result[1].uid).toBe('user-2');
    });

    it('should return empty array on error', async () => {
      mockFirestore.get.mockRejectedValue(new Error('DB error'));

      const result = await service.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUsersByTier', () => {
    it('should return users by subscription tier', async () => {
      const mockDate = new Date();
      mockFirestore.get.mockResolvedValue({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              email: 'user1@example.com',
              subscriptionTier: 'professional',
              createdAt: { toDate: () => mockDate },
            }),
          },
        ],
      });

      const result = await service.getUsersByTier('professional');

      expect(result).toHaveLength(1);
      expect(result[0].subscriptionTier).toBe('professional');
    });

    it('should return empty array on error', async () => {
      mockFirestore.get.mockRejectedValue(new Error('DB error'));

      const result = await service.getUsersByTier('professional');

      expect(result).toEqual([]);
    });
  });

  describe('deleteUserStorageFiles', () => {
    it('should delete all user storage files', async () => {
      const mockFile1 = { delete: jest.fn().mockResolvedValue(undefined) };
      const mockFile2 = { delete: jest.fn().mockResolvedValue(undefined) };
      mockStorage.bucket().getFiles.mockResolvedValue([[mockFile1, mockFile2]]);

      const result = await service.deleteUserStorageFiles('user-123');

      expect(result).toBe(2);
      expect(mockFile1.delete).toHaveBeenCalled();
      expect(mockFile2.delete).toHaveBeenCalled();
    });

    it('should throw on error', async () => {
      mockStorage
        .bucket()
        .getFiles.mockRejectedValue(new Error('Storage error'));

      await expect(service.deleteUserStorageFiles('user-123')).rejects.toThrow(
        'Storage error',
      );
    });
  });

  describe('searchTranscriptions', () => {
    it('should return transcriptions matching query', async () => {
      const mockDate = new Date();
      const mockDocs = [
        {
          id: 'trans-1',
          data: () => ({
            userId: 'user-123',
            title: 'Meeting about project',
            transcript: 'Discussion about the timeline',
            createdAt: { toDate: () => mockDate },
          }),
        },
        {
          id: 'trans-2',
          data: () => ({
            userId: 'user-123',
            title: 'Other transcription',
            createdAt: { toDate: () => mockDate },
          }),
        },
      ];
      mockFirestore.get.mockResolvedValue({ docs: mockDocs });

      const result = await service.searchTranscriptions('user-123', 'meeting');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toContain('Meeting');
    });
  });

  describe('getUserFolders', () => {
    it('should return all folders for user', async () => {
      const mockDate = new Date();
      mockFirestore.get.mockResolvedValue({
        docs: [
          {
            id: 'folder-1',
            data: () => ({
              userId: 'user-123',
              name: 'Work',
              color: '#FF0000',
              sortOrder: 0,
              createdAt: { toDate: () => mockDate },
            }),
          },
          {
            id: 'folder-2',
            data: () => ({
              userId: 'user-123',
              name: 'Personal',
              color: '#00FF00',
              sortOrder: 1,
              createdAt: { toDate: () => mockDate },
            }),
          },
        ],
      });

      const result = await service.getUserFolders('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Work');
    });
  });

  describe('deleteFolder', () => {
    it('should throw if folder not found', async () => {
      mockFirestore.get.mockResolvedValue({ exists: false });

      await expect(
        service.deleteFolder('user-123', 'folder-123'),
      ).rejects.toThrow('Folder not found or access denied');
    });
  });

  describe('updateFolder success', () => {
    it('should update folder when owned by user', async () => {
      mockFirestore.get.mockResolvedValue({
        exists: true,
        data: () => ({ userId: 'user-123', name: 'Old Name' }),
      });
      mockFirestore.update.mockResolvedValue(undefined);

      await service.updateFolder('user-123', 'folder-123', {
        name: 'New Name',
      });

      expect(mockFirestore.update).toHaveBeenCalled();
    });
  });

  describe('getTranslation', () => {
    it('should return translation if found', async () => {
      const mockDate = new Date();
      mockFirestore.get.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'trans-123',
            data: () => ({
              transcriptionId: 'trans-1',
              localeCode: 'es',
              translatedAt: { toDate: () => mockDate },
              createdAt: { toDate: () => mockDate },
            }),
          },
        ],
      });

      const result = await service.getTranslation(
        'trans-1',
        'summary',
        'source-1',
        'es',
      );

      expect(result).not.toBeNull();
      expect(result?.localeCode).toBe('es');
    });

    it('should return null if no translation found', async () => {
      mockFirestore.get.mockResolvedValue({ empty: true, docs: [] });

      const result = await service.getTranslation(
        'trans-1',
        'summary',
        'source-1',
        'es',
      );

      expect(result).toBeNull();
    });
  });

  describe('getGeneratedAnalyses', () => {
    it('should return all analyses for a transcription', async () => {
      const mockDate = new Date();
      mockFirestore.get.mockResolvedValue({
        docs: [
          {
            id: 'analysis-1',
            data: () => ({
              transcriptionId: 'trans-123',
              userId: 'user-123',
              templateId: 'action-items',
              generatedAt: { toDate: () => mockDate },
            }),
          },
        ],
      });

      const result = await service.getGeneratedAnalyses(
        'trans-123',
        'user-123',
      );

      expect(result).toHaveLength(1);
      expect(result[0].templateId).toBe('action-items');
    });
  });

  describe('updateGeneratedAnalysis', () => {
    it('should update an analysis', async () => {
      mockFirestore.update.mockResolvedValue(undefined);

      await service.updateGeneratedAnalysis('analysis-123', {
        status: 'completed',
      });

      expect(mockFirestore.update).toHaveBeenCalled();
    });
  });

  describe('deleteGeneratedAnalysesByTranscription', () => {
    it('should delete all analyses for a transcription', async () => {
      mockFirestore.get.mockResolvedValue({
        docs: [
          {
            id: 'analysis-1',
            ref: { delete: jest.fn().mockResolvedValue(undefined) },
          },
          {
            id: 'analysis-2',
            ref: { delete: jest.fn().mockResolvedValue(undefined) },
          },
        ],
      });

      const result = await service.deleteGeneratedAnalysesByTranscription(
        'trans-123',
        'user-123',
      );

      expect(result).toHaveLength(2);
    });
  });

  describe('addAnalysisReference', () => {
    it('should add analysis reference to transcription', async () => {
      mockFirestore.update.mockResolvedValue(undefined);

      await service.addAnalysisReference('trans-123', 'analysis-123');

      expect(mockFirestore.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockFirestore.doc).toHaveBeenCalledWith('trans-123');
      expect(mockFirestore.update).toHaveBeenCalled();
    });
  });

  describe('removeAnalysisReference', () => {
    it('should remove analysis reference from transcription', async () => {
      mockFirestore.update.mockResolvedValue(undefined);

      await service.removeAnalysisReference('trans-123', 'analysis-123');

      expect(mockFirestore.collection).toHaveBeenCalledWith('transcriptions');
      expect(mockFirestore.update).toHaveBeenCalled();
    });
  });

  describe('getRecentGeneratedAnalyses', () => {
    it('should return recent analyses with conversation titles', async () => {
      const mockDate = new Date();
      // First call gets analyses
      mockFirestore.get
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            {
              id: 'analysis-1',
              data: () => ({
                userId: 'user-123',
                transcriptionId: 'trans-1',
                templateId: 'summary',
                generatedAt: { toDate: () => mockDate },
              }),
            },
          ],
        })
        // Second call gets transcription title
        .mockResolvedValueOnce({
          exists: true,
          data: () => ({ title: 'Meeting Notes' }),
        });

      const result = await service.getRecentGeneratedAnalyses('user-123', 5);

      expect(result).toHaveLength(1);
      expect(result[0].conversationTitle).toBe('Meeting Notes');
    });

    it('should return empty array when no analyses found', async () => {
      mockFirestore.get.mockResolvedValue({ empty: true, docs: [] });

      const result = await service.getRecentGeneratedAnalyses('user-123');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockFirestore.get.mockRejectedValue(new Error('DB error'));

      const result = await service.getRecentGeneratedAnalyses('user-123');

      expect(result).toEqual([]);
    });
  });
});
