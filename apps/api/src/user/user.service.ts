import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { User, UserRole } from '@transcribe/shared';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private firebaseService: FirebaseService) {}

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await this.firebaseService.firestore
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        // Create user profile if it doesn't exist
        const userData = await this.createUserProfile(userId);
        return userData;
      }

      const data = userDoc.data();
      return {
        uid: userId,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
      } as User;
    } catch (error) {
      this.logger.error(`Error getting user profile for ${userId}:`, error);
      throw error;
    }
  }

  async createUserProfile(userId: string): Promise<User> {
    try {
      // Get user info from Firebase Auth
      const authUser = await this.firebaseService.auth.getUser(userId);
      
      const userData: Omit<User, 'uid'> = {
        email: authUser.email || '',
        emailVerified: authUser.emailVerified || false,
        displayName: authUser.displayName || undefined,
        photoURL: authUser.photoURL || undefined,
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.firebaseService.firestore
        .collection('users')
        .doc(userId)
        .set(userData);

      return { uid: userId, ...userData };
    } catch (error) {
      this.logger.error(`Error creating user profile for ${userId}:`, error);
      throw error;
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: { preferredLanguage?: string },
  ): Promise<User> {
    try {
      // Ensure user profile exists
      let user = await this.getUserProfile(userId);
      
      if (!user) {
        user = await this.createUserProfile(userId);
      }

      // Update preferences
      const updates = {
        ...preferences,
        updatedAt: new Date(),
      };

      await this.firebaseService.firestore
        .collection('users')
        .doc(userId)
        .update(updates);

      // Return updated user
      const updatedUser = await this.getUserProfile(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }
      
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating preferences for user ${userId}:`,
        error,
      );
      throw error;
    }
  }
}