import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UsageService } from '../usage/usage.service';
import { FirebaseService } from '../firebase/firebase.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { createTestUser } from '../../test/factories';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: any;
  let mockUsageService: any;
  let mockFirebaseService: any;

  const mockRequest = (
    uid: string = 'user-123',
    email: string = 'test@example.com',
  ) => ({
    user: { uid, email },
  });

  beforeEach(async () => {
    mockUserService = {
      getUserProfile: jest.fn(),
      updateUserProfile: jest.fn(),
      uploadProfilePhoto: jest.fn(),
      deleteProfilePhoto: jest.fn(),
      updateUserPreferences: jest.fn(),
      updateEmailNotifications: jest.fn(),
      deleteAccount: jest.fn(),
    };

    mockUsageService = {
      getUsageStats: jest.fn(),
    };

    mockFirebaseService = {
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'user-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: UsageService, useValue: mockUsageService },
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const user = createTestUser({ uid: 'user-123' });
      mockUserService.getUserProfile.mockResolvedValue(user);

      const result = await controller.getProfile(mockRequest() as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(user);
      expect(mockUserService.getUserProfile).toHaveBeenCalledWith('user-123');
    });

    it('should return undefined data when user not found', async () => {
      mockUserService.getUserProfile.mockResolvedValue(null);

      const result = await controller.getProfile(mockRequest() as any);

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = createTestUser({
        uid: 'user-123',
        displayName: 'New Name',
      });
      mockUserService.updateUserProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest() as any, {
        displayName: 'New Name',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedUser);
      expect(mockUserService.updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        { displayName: 'New Name' },
      );
    });

    it('should update photo URL', async () => {
      const updatedUser = createTestUser({
        uid: 'user-123',
        photoURL: 'https://example.com/photo.jpg',
      });
      mockUserService.updateUserProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest() as any, {
        photoURL: 'https://example.com/photo.jpg',
      });

      expect(result.success).toBe(true);
      expect(result.data.photoURL).toBe('https://example.com/photo.jpg');
    });
  });

  describe('uploadProfilePhoto', () => {
    const mockFile: Express.Multer.File = {
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('image content'),
      size: 1024 * 1024,
      fieldname: 'photo',
      encoding: '7bit',
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('should upload profile photo', async () => {
      mockUserService.uploadProfilePhoto.mockResolvedValue(
        'https://storage.example.com/photo.jpg',
      );

      const result = await controller.uploadProfilePhoto(
        mockRequest() as any,
        mockFile,
      );

      expect(result.success).toBe(true);
      expect(result.data.photoURL).toBe(
        'https://storage.example.com/photo.jpg',
      );
      expect(mockUserService.uploadProfilePhoto).toHaveBeenCalledWith(
        'user-123',
        mockFile,
      );
    });

    it('should throw when no file provided', async () => {
      await expect(
        controller.uploadProfilePhoto(mockRequest() as any, undefined as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw on upload error', async () => {
      mockUserService.uploadProfilePhoto.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        controller.uploadProfilePhoto(mockRequest() as any, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteProfilePhoto', () => {
    it('should delete profile photo', async () => {
      mockUserService.deleteProfilePhoto.mockResolvedValue(undefined);

      const result = await controller.deleteProfilePhoto(mockRequest() as any);

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(mockUserService.deleteProfilePhoto).toHaveBeenCalledWith(
        'user-123',
      );
    });

    it('should throw on delete error', async () => {
      mockUserService.deleteProfilePhoto.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        controller.deleteProfilePhoto(mockRequest() as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updatedUser = createTestUser({ uid: 'user-123' });
      mockUserService.updateUserPreferences.mockResolvedValue(updatedUser);

      const result = await controller.updatePreferences(mockRequest() as any, {
        preferredLanguage: 'de',
      });

      expect(result.success).toBe(true);
      expect(mockUserService.updateUserPreferences).toHaveBeenCalledWith(
        'user-123',
        { preferredLanguage: 'de' },
      );
    });
  });

  describe('updateEmailNotifications', () => {
    it('should update email notifications', async () => {
      const updatedUser = createTestUser({ uid: 'user-123' });
      mockUserService.updateEmailNotifications.mockResolvedValue(updatedUser);

      const result = await controller.updateEmailNotifications(
        mockRequest() as any,
        { enabled: true, digest: 'daily' },
      );

      expect(result.success).toBe(true);
      expect(mockUserService.updateEmailNotifications).toHaveBeenCalledWith(
        'user-123',
        { enabled: true, digest: 'daily' },
      );
    });
  });

  describe('getUsageStats', () => {
    it('should return usage stats', async () => {
      const user = createTestUser({
        uid: 'user-123',
        usageThisMonth: {
          transcriptionHours: 5,
          transcriptionCount: 10,
          onDemandAnalysesCount: 5,
          lastResetAt: new Date('2024-01-01'),
        },
        paygCredits: 100,
      });
      mockUserService.getUserProfile.mockResolvedValue(user);
      mockUsageService.getUsageStats.mockResolvedValue({
        tier: 'FREE',
        usage: { hours: 5, transcriptions: 10, onDemandAnalyses: 5 },
        limits: { transcriptions: 3, hours: 30 },
        overage: { hours: 0, amount: 0 },
        percentUsed: 33,
        warnings: [],
      });

      const result = await controller.getUsageStats(mockRequest() as any);

      expect(result.success).toBe(true);
      expect(result.data.tier).toBe('FREE');
      expect(result.data.paygCredits).toBe(100);
      expect(result.data.resetDate).toBeDefined();
    });

    it('should handle Firestore timestamp in lastResetAt', async () => {
      const user = createTestUser({
        uid: 'user-123',
        usageThisMonth: {
          transcriptionHours: 0,
          transcriptionCount: 0,
          onDemandAnalysesCount: 0,
          lastResetAt: { toDate: () => new Date('2024-06-15') } as any,
        },
      });
      mockUserService.getUserProfile.mockResolvedValue(user);
      mockUsageService.getUsageStats.mockResolvedValue({
        tier: 'FREE',
        usage: { hours: 0, transcriptions: 0, onDemandAnalyses: 0 },
        limits: { transcriptions: 3 },
        overage: { hours: 0, amount: 0 },
        percentUsed: 0,
        warnings: [],
      });

      const result = await controller.getUsageStats(mockRequest() as any);

      expect(result.success).toBe(true);
      // Next reset should be July 1st
      expect(result.data.resetDate.getMonth()).toBe(6); // July (0-indexed)
    });

    it('should handle invalid lastResetAt date', async () => {
      const user = createTestUser({
        uid: 'user-123',
        usageThisMonth: {
          transcriptionHours: 0,
          transcriptionCount: 0,
          onDemandAnalysesCount: 0,
          lastResetAt: new Date('1970-01-01'),
        },
      });
      mockUserService.getUserProfile.mockResolvedValue(user);
      mockUsageService.getUsageStats.mockResolvedValue({
        tier: 'FREE',
        usage: { hours: 0, transcriptions: 0, onDemandAnalyses: 0 },
        limits: { transcriptions: 3 },
        overage: { hours: 0, amount: 0 },
        percentUsed: 0,
        warnings: [],
      });

      const result = await controller.getUsageStats(mockRequest() as any);

      expect(result.success).toBe(true);
      // Should use current date as fallback, so reset should be in the future
      expect(result.data.resetDate.getTime()).toBeGreaterThan(
        new Date('2020-01-01').getTime(),
      );
    });
  });

  describe('deleteAccount', () => {
    it('should perform soft delete by default', async () => {
      mockUserService.deleteAccount.mockResolvedValue({
        success: true,
        deletionType: 'soft',
        deletedData: {},
      });

      const result = await controller.deleteAccount(mockRequest() as any);

      expect(result.success).toBe(true);
      expect(result.data.deletionType).toBe('soft');
      expect(result.data.message).toContain('deactivated');
      expect(mockUserService.deleteAccount).toHaveBeenCalledWith(
        'user-123',
        false,
      );
    });

    it('should perform hard delete when requested', async () => {
      mockUserService.deleteAccount.mockResolvedValue({
        success: true,
        deletionType: 'hard',
        deletedData: {
          transcriptions: 5,
          analyses: 10,
          storageFiles: 15,
          authAccount: true,
          firestoreUser: true,
        },
      });

      const result = await controller.deleteAccount(
        mockRequest() as any,
        'true',
      );

      expect(result.success).toBe(true);
      expect(result.data.deletionType).toBe('hard');
      expect(result.data.message).toContain('permanently deleted');
      expect(mockUserService.deleteAccount).toHaveBeenCalledWith(
        'user-123',
        true,
      );
    });
  });
});
