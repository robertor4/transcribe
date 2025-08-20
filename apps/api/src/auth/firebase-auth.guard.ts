import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private firebaseService: FirebaseService) {}

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
        throw new UnauthorizedException('Email not verified. Please verify your email to access this resource.');
      }

      // Ensure user exists in database
      const user = await this.firebaseService.getUser(decodedToken.uid);
      if (!user) {
        await this.firebaseService.createUser({
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          displayName: decodedToken.name || undefined,
          photoURL: decodedToken.picture || undefined,
        });
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
}
