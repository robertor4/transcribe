import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { FirebaseService } from '../firebase/firebase.service';
import { StorageService } from '../firebase/services/storage.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import { StripeService } from '../stripe/stripe.service';
import {
  createMockFirebaseService,
  createMockStorageService,
  createMockUserRepository,
} from '../../test/mocks';
import { createTestUser } from '../../test/factories';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  let mockFirebaseService: any;

  const mockStripeService = {
    getSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  beforeEach(async () => {
    mockUserRepository = createMockUserRepository();
    mockStorageService = createMockStorageService();
    mockFirebaseService = {
      ...createMockFirebaseService(),
      auth: {
        updateUser: jest.fn().mockResolvedValue(undefined),
        getUser: jest.fn().mockResolvedValue(null),
      },
      storageService: {
        bucket: jest.fn().mockReturnValue({
          file: jest.fn().mockReturnValue({
            save: jest.fn().mockResolvedValue(undefined),
            makePublic: jest.fn().mockResolvedValue(undefined),
            getMetadata: jest.fn().mockResolvedValue([{}]),
            getSignedUrl: jest
              .fn()
              .mockResolvedValue(['https://storage.example.com/signed-url']),
            delete: jest.fn().mockResolvedValue(undefined),
          }),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: StripeService, useValue: mockStripeService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return existing user profile', async () => {
      const user = createTestUser({ uid: 'user-123' });
      mockUserRepository.getUser.mockResolvedValue(user);

      const result = await service.getUserProfile('user-123');

      expect(result).toEqual(user);
      expect(mockUserRepository.getUser).toHaveBeenCalledWith('user-123');
    });

    it('should create profile if user does not exist', async () => {
      const newUser = createTestUser({ uid: 'user-123' });
      mockUserRepository.getUser.mockResolvedValue(null);
      mockUserRepository.getUserById.mockResolvedValue({
        email: 'test@example.com',
        displayName: 'Test User',
      });
      mockUserRepository.createUser.mockResolvedValue(newUser);

      const result = await service.getUserProfile('user-123');

      expect(result).toEqual(newUser);
      expect(mockUserRepository.createUser).toHaveBeenCalled();
    });

    it('should throw error on failure', async () => {
      mockUserRepository.getUser.mockRejectedValue(new Error('Database error'));

      await expect(service.getUserProfile('user-123')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('createUserProfile', () => {
    it('should create user profile with auth data', async () => {
      const authUser = {
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };
      mockUserRepository.getUserById.mockResolvedValue(authUser);
      const createdUser = createTestUser({ uid: 'user-123', ...authUser });
      mockUserRepository.createUser.mockResolvedValue(createdUser);

      const result = await service.createUserProfile('user-123');

      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        }),
      );
      expect(result).toEqual(createdUser);
    });

    it('should handle missing auth user data', async () => {
      mockUserRepository.getUserById.mockResolvedValue(null);
      const createdUser = createTestUser({ uid: 'user-123' });
      mockUserRepository.createUser.mockResolvedValue(createdUser);

      const result = await service.createUserProfile('user-123');

      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'user-123',
          email: '',
        }),
      );
      expect(result).toEqual(createdUser);
    });
  });

  describe('updateUserProfile', () => {
    it('should update existing user profile', async () => {
      const user = createTestUser({ uid: 'user-123' });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockUserRepository.updateUser.mockResolvedValue(undefined);

      const result = await service.updateUserProfile('user-123', {
        displayName: 'New Name',
      });

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          displayName: 'New Name',
        }),
      );
      expect(result.displayName).toBe('New Name');
    });

    it('should create profile if user does not exist', async () => {
      mockUserRepository.getUser.mockResolvedValue(null);
      const newUser = createTestUser({ uid: 'user-123' });
      mockUserRepository.getUserById.mockResolvedValue({
        email: 'test@example.com',
      });
      mockUserRepository.createUser.mockResolvedValue(newUser);
      mockUserRepository.updateUser.mockResolvedValue(undefined);

      await service.updateUserProfile('user-123', {
        displayName: 'New Name',
      });

      expect(mockUserRepository.createUser).toHaveBeenCalled();
      expect(mockUserRepository.updateUser).toHaveBeenCalled();
    });

    it('should sync with Firebase Auth', async () => {
      const user = createTestUser({ uid: 'user-123' });
      mockUserRepository.getUser.mockResolvedValue(user);

      await service.updateUserProfile('user-123', {
        displayName: 'New Name',
        photoURL: 'https://example.com/new-photo.jpg',
      });

      expect(mockFirebaseService.auth.updateUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          displayName: 'New Name',
          photoURL: 'https://example.com/new-photo.jpg',
        }),
      );
    });

    it('should clear photoURL when empty string provided', async () => {
      const user = createTestUser({ uid: 'user-123' });
      mockUserRepository.getUser.mockResolvedValue(user);

      await service.updateUserProfile('user-123', {
        photoURL: '',
      });

      expect(mockFirebaseService.auth.updateUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          photoURL: null,
        }),
      );
    });
  });

  describe('uploadProfilePhoto', () => {
    const mockFile: Express.Multer.File = {
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('image content'),
      size: 1024 * 1024, // 1MB
      fieldname: 'file',
      encoding: '7bit',
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should throw for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain' };

      await expect(
        service.uploadProfilePhoto('user-123', invalidFile as any),
      ).rejects.toThrow('Invalid file type');
    });

    it('should throw for file too large', async () => {
      const largeFile = { ...mockFile, size: 10 * 1024 * 1024 }; // 10MB

      await expect(
        service.uploadProfilePhoto('user-123', largeFile as any),
      ).rejects.toThrow('File too large');
    });

    it('should accept valid jpeg file', async () => {
      mockUserRepository.getUser.mockResolvedValue(
        createTestUser({ uid: 'user-123' }),
      );
      mockUserRepository.updateUser.mockResolvedValue(undefined);

      const result = await service.uploadProfilePhoto('user-123', mockFile);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should accept valid png file', async () => {
      const pngFile = { ...mockFile, mimetype: 'image/png' };
      mockUserRepository.getUser.mockResolvedValue(
        createTestUser({ uid: 'user-123' }),
      );
      mockUserRepository.updateUser.mockResolvedValue(undefined);

      const result = await service.uploadProfilePhoto(
        'user-123',
        pngFile as any,
      );

      expect(result).toBeDefined();
    });
  });

  describe('deleteProfilePhoto', () => {
    it('should delete existing photo and clear photoURL', async () => {
      const user = createTestUser({
        uid: 'user-123',
        photoURL:
          'https://storage.googleapis.com/bucket/profile-photos/user-123/photo.jpg',
      });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockUserRepository.updateUser.mockResolvedValue(undefined);

      await service.deleteProfilePhoto('user-123');

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          photoURL: '',
        }),
      );
      expect(mockFirebaseService.auth.updateUser).toHaveBeenCalledWith(
        'user-123',
        { photoURL: null },
      );
    });

    it('should succeed even when user has no photoURL', async () => {
      const user = createTestUser({ uid: 'user-123', photoURL: null });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockUserRepository.updateUser.mockResolvedValue(undefined);

      await service.deleteProfilePhoto('user-123');

      expect(mockUserRepository.updateUser).toHaveBeenCalled();
    });
  });

  describe('updateUserPreferences', () => {
    it('should call updateUser when updating preferences', async () => {
      const user = createTestUser({ uid: 'user-123' });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockUserRepository.updateUser.mockResolvedValue(undefined);

      await service.updateUserPreferences('user-123', {
        preferredLanguage: 'es',
      });

      expect(mockUserRepository.updateUser).toHaveBeenCalled();
    });
  });

  describe('updateEmailNotifications', () => {
    it('should update email notification settings', async () => {
      const user = createTestUser({ uid: 'user-123' });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockUserRepository.updateUser.mockResolvedValue(undefined);

      await service.updateEmailNotifications('user-123', {
        enabled: true,
        onTranscriptionComplete: false,
      });

      expect(mockUserRepository.updateUser).toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('should perform soft delete by default', async () => {
      mockUserRepository.softDeleteUser.mockResolvedValue(undefined);

      const result = await service.deleteAccount('user-123');

      expect(result.success).toBe(true);
      expect(result.deletionType).toBe('soft');
      expect(mockUserRepository.softDeleteUser).toHaveBeenCalledWith(
        'user-123',
      );
      expect(mockStripeService.cancelSubscription).not.toHaveBeenCalled();
    });

    it('should perform hard delete when hardDelete is true', async () => {
      const user = createTestUser({
        uid: 'user-123',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
      });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockUserRepository.deleteUserTranscriptions.mockResolvedValue(5);
      mockUserRepository.deleteUserGeneratedAnalyses.mockResolvedValue(10);
      mockStorageService.deleteUserFiles.mockResolvedValue(20);
      mockStripeService.cancelSubscription.mockResolvedValue(true);
      mockStripeService.deleteCustomer = jest.fn().mockResolvedValue(true);
      mockUserRepository.deleteUser.mockResolvedValue(undefined);
      mockFirebaseService.auth.deleteUser = jest
        .fn()
        .mockResolvedValue(undefined);

      const result = await service.deleteAccount('user-123', true);

      expect(result.success).toBe(true);
      expect(result.deletionType).toBe('hard');
      expect(result.deletedData.transcriptions).toBe(5);
      expect(result.deletedData.analyses).toBe(10);
      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith(
        'sub_123',
        false,
      );
      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith('user-123');
    });

    it('should hard delete without Stripe subscription', async () => {
      const user = createTestUser({ uid: 'user-123' });
      mockUserRepository.getUser.mockResolvedValue(user);
      mockUserRepository.deleteUserTranscriptions.mockResolvedValue(0);
      mockUserRepository.deleteUserGeneratedAnalyses.mockResolvedValue(0);
      mockStorageService.deleteUserFiles.mockResolvedValue(0);
      mockUserRepository.deleteUser.mockResolvedValue(undefined);
      mockFirebaseService.auth.deleteUser = jest
        .fn()
        .mockResolvedValue(undefined);

      const result = await service.deleteAccount('user-123', true);

      expect(result.success).toBe(true);
      expect(mockStripeService.cancelSubscription).not.toHaveBeenCalled();
      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith('user-123');
    });
  });
});
