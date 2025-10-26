import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { StripeService } from '../stripe/stripe.service';
import { User, UserRole } from '@transcribe/shared';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private firebaseService: FirebaseService,
    private stripeService: StripeService,
  ) {}

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
        subscriptionTier: 'free', // Default to free tier
        usageThisMonth: {
          hours: 0,
          transcriptions: 0,
          onDemandAnalyses: 0,
          lastResetAt: new Date(),
        },
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

  async updateUserProfile(
    userId: string,
    profile: { displayName?: string; photoURL?: string },
  ): Promise<User> {
    try {
      // Ensure user profile exists
      let user = await this.getUserProfile(userId);

      if (!user) {
        user = await this.createUserProfile(userId);
      }

      // Update profile in Firestore
      const updates = {
        ...profile,
        updatedAt: new Date(),
      };

      await this.firebaseService.firestore
        .collection('users')
        .doc(userId)
        .update(updates);

      // Also update Firebase Auth profile to keep them in sync
      // This ensures photoURL and displayName are reflected in the user object
      const authUpdates: { displayName?: string; photoURL?: string } = {};
      if (profile.displayName !== undefined) {
        authUpdates.displayName = profile.displayName;
      }
      if (profile.photoURL !== undefined) {
        authUpdates.photoURL = profile.photoURL;
      }

      if (Object.keys(authUpdates).length > 0) {
        await this.firebaseService.auth.updateUser(userId, authUpdates);
      }

      // Return updated user
      const updatedUser = await this.getUserProfile(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating profile for user ${userId}:`, error);
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

  async updateEmailNotifications(
    userId: string,
    emailNotifications: {
      enabled?: boolean;
      onTranscriptionComplete?: boolean;
      digest?: 'immediate' | 'daily' | 'weekly';
    },
  ): Promise<User> {
    try {
      // Ensure user profile exists
      let user = await this.getUserProfile(userId);

      if (!user) {
        user = await this.createUserProfile(userId);
      }

      // Merge with existing email notification settings
      const currentEmailNotifications = user.emailNotifications || {
        enabled: true,
        onTranscriptionComplete: true,
        digest: 'immediate',
      };

      const updatedEmailNotifications = {
        ...currentEmailNotifications,
        ...emailNotifications,
      };

      // Update email notification preferences
      const updates = {
        emailNotifications: updatedEmailNotifications,
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
        `Error updating email notifications for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete user account (soft delete by default)
   * @param userId - The user ID to delete
   * @param hardDelete - If true, permanently delete all user data and auth account
   * @returns Statistics about what was deleted
   */
  async deleteAccount(
    userId: string,
    hardDelete = false,
  ): Promise<{
    success: boolean;
    deletionType: 'soft' | 'hard';
    deletedData: {
      transcriptions?: number;
      analyses?: number;
      storageFiles?: number;
      authAccount?: boolean;
      firestoreUser?: boolean;
    };
  }> {
    try {
      this.logger.log(
        `Starting ${hardDelete ? 'HARD' : 'SOFT'} delete for user ${userId}`,
      );

      const deletedData: {
        transcriptions?: number;
        analyses?: number;
        storageFiles?: number;
        authAccount?: boolean;
        firestoreUser?: boolean;
      } = {};

      if (hardDelete) {
        // HARD DELETE: Permanently remove all user data
        this.logger.log(
          `Performing hard delete - all data will be permanently removed`,
        );

        // 1. Delete all user transcriptions
        const transcriptionsDeleted =
          await this.firebaseService.deleteUserTranscriptions(userId);
        deletedData.transcriptions = transcriptionsDeleted;

        // 2. Delete all generated analyses
        const analysesDeleted =
          await this.firebaseService.deleteUserGeneratedAnalyses(userId);
        deletedData.analyses = analysesDeleted;

        // 3. Delete all storage files
        const storageFilesDeleted =
          await this.firebaseService.deleteUserStorageFiles(userId);
        deletedData.storageFiles = storageFilesDeleted;

        // 4. Cancel Stripe subscription and delete customer
        const user = await this.getUserProfile(userId);
        if (user) {
          // Cancel active subscription immediately (if exists)
          if (user.stripeSubscriptionId) {
            try {
              await this.stripeService.cancelSubscription(
                user.stripeSubscriptionId,
                false, // Cancel immediately, not at period end
              );
              this.logger.log(
                `Cancelled Stripe subscription ${user.stripeSubscriptionId} for user ${userId}`,
              );
            } catch (error: any) {
              this.logger.warn(
                `Failed to cancel subscription ${user.stripeSubscriptionId}: ${error.message}`,
              );
              // Continue with deletion even if subscription cancel fails
            }
          }

          // Delete Stripe customer (this also deletes all associated subscriptions, payment methods, etc.)
          if (user.stripeCustomerId) {
            try {
              await this.stripeService.deleteCustomer(user.stripeCustomerId);
              this.logger.log(
                `Deleted Stripe customer ${user.stripeCustomerId} for user ${userId}`,
              );
            } catch (error: any) {
              this.logger.warn(
                `Failed to delete Stripe customer ${user.stripeCustomerId}: ${error.message}`,
              );
              // Continue with deletion even if customer delete fails
            }
          }
        }

        // 5. Delete Firestore user document
        await this.firebaseService.deleteUser(userId);
        deletedData.firestoreUser = true;

        // 6. Delete Firebase Auth account (LAST - no going back after this!)
        try {
          await this.firebaseService.auth.deleteUser(userId);
          deletedData.authAccount = true;
          this.logger.log(`Deleted Firebase Auth account for user ${userId}`);
        } catch (error: any) {
          // Auth account might already be deleted or not exist
          if (error?.code === 'auth/user-not-found') {
            this.logger.warn(
              `Auth account not found for ${userId}, may already be deleted`,
            );
            deletedData.authAccount = false;
          } else {
            throw error;
          }
        }

        this.logger.log(
          `Hard delete completed for user ${userId}:`,
          deletedData,
        );

        return {
          success: true,
          deletionType: 'hard',
          deletedData,
        };
      } else {
        // SOFT DELETE: Mark user as deleted, preserve all data
        this.logger.log(
          `Performing soft delete - user will be marked as deleted, data preserved`,
        );

        await this.firebaseService.softDeleteUser(userId);
        deletedData.firestoreUser = true;

        // Note: We do NOT cancel Stripe subscription on soft delete
        // This allows easy account recovery if needed
        this.logger.log(
          `Soft delete completed for user ${userId} - Stripe subscription preserved`,
        );

        return {
          success: true,
          deletionType: 'soft',
          deletedData,
        };
      }
    } catch (error) {
      this.logger.error(`Error deleting account for user ${userId}:`, error);
      throw error;
    }
  }
}
