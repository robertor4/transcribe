import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { UserRepository } from '../firebase/repositories/user.repository';
import { UserRole } from '@transcribe/shared';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let mockUserRepository: any;

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  beforeEach(async () => {
    mockUserRepository = {
      getUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for admin users', async () => {
      const user = { uid: 'admin-123', email: 'admin@example.com' };
      mockUserRepository.getUser.mockResolvedValue({
        uid: 'admin-123',
        role: UserRole.ADMIN,
      });

      const context = createMockContext(user);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockUserRepository.getUser).toHaveBeenCalledWith('admin-123');
    });

    it('should throw ForbiddenException when user is not in request', async () => {
      const context = createMockContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authentication required',
      );
    });

    it('should throw ForbiddenException when user has no uid', async () => {
      const context = createMockContext({ email: 'test@example.com' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user profile not found', async () => {
      const user = { uid: 'unknown-123', email: 'unknown@example.com' };
      mockUserRepository.getUser.mockResolvedValue(null);

      const context = createMockContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'User profile not found',
      );
    });

    it('should throw ForbiddenException when user is not admin', async () => {
      const user = { uid: 'user-123', email: 'user@example.com' };
      mockUserRepository.getUser.mockResolvedValue({
        uid: 'user-123',
        role: UserRole.USER,
      });

      const context = createMockContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Admin access required',
      );
    });

    it('should throw ForbiddenException when user has undefined role', async () => {
      const user = { uid: 'user-123', email: 'user@example.com' };
      mockUserRepository.getUser.mockResolvedValue({
        uid: 'user-123',
        // No role field
      });

      const context = createMockContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
