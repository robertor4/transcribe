import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UserRepository } from '../firebase/repositories/user.repository';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  // Throttle login updates to once per hour (reduces Firestore writes)
  private readonly LOGIN_UPDATE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

  constructor(
    private firebaseService: FirebaseService,
    private userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('No authorization header provided');
    }

    const token = authorization.replace('Bearer ', '');

    try {
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      request.user = decodedToken;

      // Check if email is verified
      if (decodedToken.email_verified === false) {
        throw new UnauthorizedException(
          'Email not verified. Please verify your email to access this resource.',
        );
      }

      // Ensure user exists in database
      const user = await this.userRepository.getUser(decodedToken.uid);
      if (!user) {
        await this.userRepository.createUser({
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || undefined,
          photoURL: decodedToken.picture || undefined,
        });
      } else {
        // Update lastLogin timestamp (throttled to once per hour)
        const shouldUpdateLogin = this.shouldUpdateLastLogin(user.lastLogin);
        if (shouldUpdateLogin) {
          await this.userRepository.updateUser(decodedToken.uid, {
            lastLogin: new Date(),
          });
        }
      }

      return true;
    } catch (error) {
      // If it's already an UnauthorizedException with a specific message, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Determines if lastLogin should be updated based on throttling threshold
   * @param lastLogin The user's last login timestamp
   * @returns true if lastLogin should be updated, false otherwise
   */
  private shouldUpdateLastLogin(lastLogin?: Date): boolean {
    if (!lastLogin) {
      return true; // First login or no previous login recorded
    }

    const now = Date.now();
    const lastLoginTime =
      lastLogin instanceof Date
        ? lastLogin.getTime()
        : new Date(lastLogin).getTime();
    const timeSinceLastLogin = now - lastLoginTime;

    // Update if more than threshold has passed since last login
    return timeSinceLastLogin >= this.LOGIN_UPDATE_THRESHOLD_MS;
  }
}
