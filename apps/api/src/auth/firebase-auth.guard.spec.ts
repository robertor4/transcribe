import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseService } from '../firebase/firebase.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import {
  createMockFirebaseService,
  createMockUserRepository,
} from '../../test/mocks';
import { createTestUser } from '../../test/factories';

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;
  let mockFirebaseService: ReturnType<typeof createMockFirebaseService>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;

  const createMockExecutionContext = (
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    const mockRequest = {
      headers,
      user: null,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    mockFirebaseService = createMockFirebaseService();
    mockUserRepository = createMockUserRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthGuard,
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    guard = module.get<FirebaseAuthGuard>(FirebaseAuthGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException if no authorization header', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'No authorization header provided',
      );
    });

    it('should verify token and attach user to request', async () => {
      const decodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
      };
      mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
      mockUserRepository.getUser.mockResolvedValue(
        createTestUser({ uid: 'user-123' }),
      );

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockFirebaseService.verifyIdToken).toHaveBeenCalledWith(
        'valid-token',
      );
    });

    it('should strip Bearer prefix from token', async () => {
      const decodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
        email_verified: true,
      };
      mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
      mockUserRepository.getUser.mockResolvedValue(
        createTestUser({ uid: 'user-123' }),
      );

      const context = createMockExecutionContext({
        authorization: 'Bearer my-token-123',
      });

      await guard.canActivate(context);

      expect(mockFirebaseService.verifyIdToken).toHaveBeenCalledWith(
        'my-token-123',
      );
    });

    it('should throw UnauthorizedException if email not verified', async () => {
      const decodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
        email_verified: false,
      };
      mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Email not verified',
      );
    });

    it('should create user if not exists in database', async () => {
      const decodedToken = {
        uid: 'new-user-123',
        email: 'new@example.com',
        email_verified: true,
        name: 'New User',
        picture: 'https://example.com/photo.jpg',
      };
      mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
      mockUserRepository.getUser.mockResolvedValue(null);

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      await guard.canActivate(context);

      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        uid: 'new-user-123',
        email: 'new@example.com',
        displayName: 'New User',
        photoURL: 'https://example.com/photo.jpg',
      });
    });

    it('should update lastLogin if threshold exceeded', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const decodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
        email_verified: true,
      };
      mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
      mockUserRepository.getUser.mockResolvedValue(
        createTestUser({ uid: 'user-123', lastLogin: twoHoursAgo }),
      );

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      await guard.canActivate(context);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith('user-123', {
        lastLogin: expect.any(Date),
      });
    });

    it('should not update lastLogin if within threshold', async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const decodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
        email_verified: true,
      };
      mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
      mockUserRepository.getUser.mockResolvedValue(
        createTestUser({ uid: 'user-123', lastLogin: fiveMinutesAgo }),
      );

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      await guard.canActivate(context);

      expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
    });

    it('should update lastLogin if no previous login recorded', async () => {
      const decodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
        email_verified: true,
      };
      mockFirebaseService.verifyIdToken.mockResolvedValue(decodedToken);
      mockUserRepository.getUser.mockResolvedValue(
        createTestUser({ uid: 'user-123', lastLogin: undefined }),
      );

      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      await guard.canActivate(context);

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith('user-123', {
        lastLogin: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      mockFirebaseService.verifyIdToken.mockRejectedValue(
        new Error('Invalid token'),
      );

      const context = createMockExecutionContext({
        authorization: 'Bearer invalid-token',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid or expired token',
      );
    });

    it('should re-throw UnauthorizedException with original message', async () => {
      const customError = new UnauthorizedException('Custom error message');
      mockFirebaseService.verifyIdToken.mockRejectedValue(customError);

      const context = createMockExecutionContext({
        authorization: 'Bearer some-token',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Custom error message',
      );
    });
  });

  describe('shouldUpdateLastLogin', () => {
    it('should return true if no lastLogin', () => {
      const result = (guard as any).shouldUpdateLastLogin(undefined);
      expect(result).toBe(true);
    });

    it('should return true if lastLogin is old', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = (guard as any).shouldUpdateLastLogin(twoHoursAgo);
      expect(result).toBe(true);
    });

    it('should return false if lastLogin is recent', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const result = (guard as any).shouldUpdateLastLogin(tenMinutesAgo);
      expect(result).toBe(false);
    });

    it('should handle lastLogin as string', () => {
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000,
      ).toISOString();
      const result = (guard as any).shouldUpdateLastLogin(twoHoursAgo as any);
      expect(result).toBe(true);
    });
  });
});
