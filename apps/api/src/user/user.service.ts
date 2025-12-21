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
      const updatedAt = new Date();
      const updates = {
        ...profile,
        updatedAt,
      };

      // Also update Firebase Auth profile to keep them in sync
      // This ensures photoURL and displayName are reflected in the user object
      const authUpdates: { displayName?: string; photoURL?: string | null } =
        {};
      if (profile.displayName !== undefined) {
        authUpdates.displayName = profile.displayName;
      }
      if (profile.photoURL !== undefined) {
        // Firebase Auth requires null to clear photoURL, empty string is invalid
        authUpdates.photoURL = profile.photoURL || null;
      }

      // Run Firestore and Auth updates in parallel for better performance
      await Promise.all([
        this.firebaseService.firestore
          .collection('users')
          .doc(userId)
          .update(updates),
        Object.keys(authUpdates).length > 0
          ? this.firebaseService.auth.updateUser(userId, authUpdates)
          : Promise.resolve(),
      ]);

      // Return merged user data without extra fetch
      return {
        ...user,
        ...profile,
        updatedAt,
      } as User;
    } catch (error) {
      this.logger.error(`Error updating profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Upload a profile photo to Firebase Storage and update user profile
   * @param userId - The user ID
   * @param file - The uploaded file (must be image/jpeg or image/png, max 5MB)
   * @returns The public URL of the uploaded photo
   */
  async uploadProfilePhoto(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(
          'Invalid file type. Only JPG and PNG files are allowed.',
        );
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 5MB.');
      }

      // Get file extension from mimetype
      const ext = file.mimetype === 'image/jpeg' ? 'jpg' : 'png';

      // Generate unique filename - use 'profiles/' path to match storage.rules
      const timestamp = Date.now();
      const filePath = `profiles/${userId}/${timestamp}.${ext}`;

      // Get the user's current photo URL to delete old photo later
      const currentUser = await this.getUserProfile(userId);
      const oldPhotoPath =
        currentUser?.photoURL?.includes('profiles/') ||
        currentUser?.photoURL?.includes('profile-photos/')
          ? this.extractPathFromUrl(currentUser.photoURL)
          : null;

      // Upload to Firebase Storage
      const bucket = this.firebaseService.storageService.bucket();
      const fileRef = bucket.file(filePath);

      await fileRef.save(file.buffer, {
        contentType: file.mimetype,
        metadata: {
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
      });

      // Generate a signed URL with maximum expiration (7 days is the max for V4 signatures)
      // For profile photos, we'll regenerate the URL when it's close to expiring
      // or use a public bucket policy
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days (max for V4)
      });

      const publicUrl = signedUrl;

      // Update user profile with new photo URL
      await this.updateUserProfile(userId, { photoURL: publicUrl });

      // Delete old profile photo if it was a custom upload
      if (oldPhotoPath) {
        try {
          await bucket.file(oldPhotoPath).delete();
          this.logger.log(`Deleted old profile photo: ${oldPhotoPath}`);
        } catch (error) {
          // Don't fail if old photo deletion fails
          this.logger.warn(
            `Failed to delete old profile photo: ${oldPhotoPath}`,
          );
        }
      }

      this.logger.log(
        `Profile photo uploaded for user ${userId}: ${publicUrl}`,
      );
      return publicUrl;
    } catch (error) {
      this.logger.error(`Error uploading profile photo for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user's profile photo from storage and clear photoURL
   */
  async deleteProfilePhoto(userId: string): Promise<void> {
    try {
      const user = await this.getUserProfile(userId);

      if (
        user?.photoURL?.includes('profiles/') ||
        user?.photoURL?.includes('profile-photos/')
      ) {
        const filePath = this.extractPathFromUrl(user.photoURL);
        if (filePath) {
          const bucket = this.firebaseService.storageService.bucket();
          try {
            await bucket.file(filePath).delete();
            this.logger.log(`Deleted profile photo: ${filePath}`);
          } catch (error) {
            this.logger.warn(`Failed to delete profile photo: ${filePath}`);
          }
        }
      }

      // Clear the photoURL in user profile
      await this.updateUserProfile(userId, { photoURL: '' });
      this.logger.log(`Profile photo cleared for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error deleting profile photo for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Extract Firebase Storage path from public URL
   * Handles multiple formats:
   * - https://storage.googleapis.com/bucket/path (GCS public)
   * - https://storage.googleapis.com/bucket/path?X-Goog-... (GCS signed URL)
   * - https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media&token=xxx
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      // Firebase Storage download URL format
      const firebaseMatch = url.match(
        /firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)/,
      );
      if (firebaseMatch) {
        return decodeURIComponent(firebaseMatch[1]);
      }

      // Google Cloud Storage format (with or without query params for signed URLs)
      // URL format: https://storage.googleapis.com/bucket-name/path/to/file?X-Goog-...
      const gcsMatch = url.match(/storage\.googleapis\.com\/[^/]+\/([^?]+)/);
      if (gcsMatch) {
        return decodeURIComponent(gcsMatch[1]);
      }

      return null;
    } catch {
      return null;
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
