import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { FirebaseService } from '../firebase.service';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockFirebaseService: any;
  let mockDb: any;
  let mockAuth: any;
  let mockCollection: any;
  let mockDoc: any;
  let mockBatch: any;

  const mockUserData = {
    email: 'test@example.com',
    displayName: 'Test User',
    subscriptionTier: 'free',
    createdAt: { toDate: () => new Date('2024-01-01') },
    updatedAt: { toDate: () => new Date('2024-01-15') },
  };

  beforeEach(async () => {
    mockDoc = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
        id: 'user123',
      }),
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockBatch = {
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'user123',
            data: () => mockUserData,
            ref: { id: 'user123' },
          },
        ],
      }),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
      batch: jest.fn().mockReturnValue(mockBatch),
    };

    mockAuth = {
      getUser: jest.fn().mockResolvedValue({
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      }),
    };

    mockFirebaseService = {
      firestore: mockDb,
      auth: mockAuth,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user from Firebase Auth', async () => {
      const result = await repository.getUserById('user123');

      expect(mockAuth.getUser).toHaveBeenCalledWith('user123');
      expect(result).toEqual({
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('should return null on error', async () => {
      mockAuth.getUser.mockRejectedValue(new Error('User not found'));

      const result = await repository.getUserById('invalid');

      expect(result).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return user from Firestore with dates converted', async () => {
      const result = await repository.getUser('user123');

      expect(mockDb.collection).toHaveBeenCalledWith('users');
      expect(mockCollection.doc).toHaveBeenCalledWith('user123');
      expect(result.uid).toBe('user123');
      expect(result.email).toBe('test@example.com');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should return null if user does not exist', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      const result = await repository.getUser('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user document with defaults', async () => {
      const userData = {
        uid: 'newuser123',
        email: 'new@example.com',
        displayName: 'New User',
      };

      await repository.createUser(userData);

      expect(mockCollection.doc).toHaveBeenCalledWith('newuser123');
      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          displayName: 'New User',
          subscriptionTier: 'free',
          usageThisMonth: expect.objectContaining({
            hours: 0,
            transcriptions: 0,
            onDemandAnalyses: 0,
          }),
        }),
      );
    });

    it('should filter out undefined values', async () => {
      const userData = {
        uid: 'newuser123',
        email: 'new@example.com',
        displayName: undefined,
        photoURL: undefined,
      };

      await repository.createUser(userData);

      const setCall = mockDoc.set.mock.calls[0][0];
      expect(setCall.displayName).toBeUndefined();
      expect(setCall.photoURL).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('should update user with updatedAt timestamp', async () => {
      await repository.updateUser('user123', { displayName: 'Updated Name' });

      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: 'Updated Name',
          updatedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('softDeleteUser', () => {
    it('should mark user as deleted', async () => {
      await repository.softDeleteUser('user123');

      expect(mockDoc.update).toHaveBeenCalledWith({
        deletedAt: expect.any(Date),
        isDeleted: true,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('deleteUser', () => {
    it('should hard delete user document', async () => {
      await repository.deleteUser('user123');

      expect(mockDoc.delete).toHaveBeenCalled();
    });
  });

  describe('getUserByStripeCustomerId', () => {
    it('should find user by Stripe customer ID', async () => {
      const result = await repository.getUserByStripeCustomerId('cus_123');

      expect(mockCollection.where).toHaveBeenCalledWith(
        'stripeCustomerId',
        '==',
        'cus_123',
      );
      expect(result.uid).toBe('user123');
    });

    it('should return null if no user found', async () => {
      mockCollection.get.mockResolvedValue({ empty: true, docs: [] });

      const result = await repository.getUserByStripeCustomerId('cus_invalid');

      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const result = await repository.getAllUsers();

      expect(mockDb.collection).toHaveBeenCalledWith('users');
      expect(result).toHaveLength(1);
      expect(result[0].uid).toBe('user123');
    });
  });

  describe('getUsersByTier', () => {
    it('should return users filtered by tier', async () => {
      const result = await repository.getUsersByTier('professional');

      expect(mockCollection.where).toHaveBeenCalledWith(
        'subscriptionTier',
        '==',
        'professional',
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('deleteUserTranscriptions', () => {
    it('should batch delete all user transcriptions', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [
          { ref: { id: 't1' } },
          { ref: { id: 't2' } },
          { ref: { id: 't3' } },
        ],
      });

      const result = await repository.deleteUserTranscriptions('user123');

      expect(mockCollection.where).toHaveBeenCalledWith(
        'userId',
        '==',
        'user123',
      );
      expect(mockBatch.delete).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(result).toBe(3);
    });
  });

  describe('deleteUserGeneratedAnalyses', () => {
    it('should batch delete all user analyses', async () => {
      mockCollection.get.mockResolvedValue({
        docs: [{ ref: { id: 'a1' } }, { ref: { id: 'a2' } }],
      });

      const result = await repository.deleteUserGeneratedAnalyses('user123');

      expect(mockDb.collection).toHaveBeenCalledWith('generatedAnalyses');
      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(result).toBe(2);
    });
  });

  describe('getUserActivity', () => {
    it('should return comprehensive user activity', async () => {
      // Setup mocks for parallel queries
      mockCollection.get
        .mockResolvedValueOnce({
          // transcriptions
          docs: [
            {
              id: 't1',
              data: () => ({
                duration: 3600,
                createdAt: { toDate: () => new Date() },
              }),
            },
          ],
        })
        .mockResolvedValueOnce({
          // analyses
          docs: [
            {
              id: 'a1',
              data: () => ({ generatedAt: { toDate: () => new Date() } }),
            },
          ],
        })
        .mockResolvedValueOnce({
          // usage records
          docs: [],
        });

      const result = await repository.getUserActivity('user123');

      expect(result).not.toBeNull();
      expect(result.user).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalTranscriptions).toBe(1);
      expect(result.summary.totalAnalysesGenerated).toBe(1);
      expect(result.accountEvents).toBeInstanceOf(Array);
    });

    it('should return null if user not found', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      const result = await repository.getUserActivity('nonexistent');

      expect(result).toBeNull();
    });
  });
});
