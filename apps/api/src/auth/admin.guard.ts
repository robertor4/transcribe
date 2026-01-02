import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserRepository } from '../firebase/repositories/user.repository';
import { User, UserRole } from '@transcribe/shared';

interface AuthenticatedRequest {
  user: {
    uid: string;
    email: string;
  };
}

/**
 * Admin Guard - Ensures user has admin role
 * Must be used together with FirebaseAuthGuard
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  constructor(private userRepository: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user: { uid: string; email: string } | undefined = request.user;

    if (!user || !user.uid) {
      this.logger.warn('AdminGuard: No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // Get user profile to check role
    const userProfile: User | null = await this.userRepository.getUser(
      user.uid,
    );

    if (!userProfile) {
      this.logger.warn(`AdminGuard: User profile not found for ${user.uid}`);
      throw new ForbiddenException('User profile not found');
    }

    if (userProfile.role !== UserRole.ADMIN) {
      this.logger.warn(
        `AdminGuard: User ${user.uid} (${user.email}) attempted to access admin route with role: ${userProfile.role}`,
      );
      throw new ForbiddenException('Admin access required');
    }

    this.logger.log(
      `AdminGuard: Granted admin access to ${user.uid} (${user.email})`,
    );
    return true;
  }
}
