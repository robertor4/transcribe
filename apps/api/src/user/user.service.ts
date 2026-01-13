import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { StorageService } from '../firebase/services/storage.service';
import { UserRepository } from '../firebase/repositories/user.repository';
import { StripeService } from '../stripe/stripe.service';
import { User } from '@transcribe/shared';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private firebaseService: FirebaseService,
    private storageService: StorageService,
    private userRepository: UserRepository,
    private stripeService: StripeService,
  ) {}

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const user = await this.userRepository.getUser(userId);

      if (!user) {
        // Create user profile if it doesn't exist
        const userData = await this.createUserProfile(userId);
        return userData;
      }

      // If user has a profilePhotoPath, generate a fresh signed URL
      if (user.profilePhotoPath) {
        const freshPhotoUrl = await this.generateProfilePhotoUrl(
          user.profilePhotoPath,
        );
        if (freshPhotoUrl) {
          user.photoURL = freshPhotoUrl;
        }
      } else if (
        user.photoURL &&
        (user.photoURL.includes('profiles/') ||
          user.photoURL.includes('profile-photos/'))
      ) {
        // Migration: Extract path from existing signed URL and store it
        const extractedPath = this.extractPathFromUrl(user.photoURL);
        if (extractedPath) {
          const freshPhotoUrl =
            await this.generateProfilePhotoUrl(extractedPath);
          if (freshPhotoUrl) {
            // Save the extracted path for future use (async, don't wait)
            this.userRepository
              .updateUser(userId, { profilePhotoPath: extractedPath })
              .catch((err) =>
                this.logger.warn(
                  `Failed to save profilePhotoPath for ${userId}:`,
                  err,
                ),
              );
            user.photoURL = freshPhotoUrl;
            user.profilePhotoPath = extractedPath;
          }
        }
      }

      return user;
    } catch (error) {
      this.logger.error(`Error getting user profile for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a fresh signed URL for a profile photo path
   * @param storagePath - The storage path (e.g., 'profiles/userId/timestamp.jpg')
   * @returns Fresh signed URL valid for 7 days, or null if generation fails
   */
  private async generateProfilePhotoUrl(
    storagePath: string,
  ): Promise<string | null> {
    try {
      const bucket = this.firebaseService.storageService.bucket();
      const fileRef = bucket.file(storagePath);

      // Check if file exists
      const [exists] = await fileRef.exists();
      if (!exists) {
        this.logger.warn(`Profile photo not found at path: ${storagePath}`);
        return null;
      }

      // Generate fresh signed URL (7 days max for V4)
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return signedUrl;
    } catch (error) {
      this.logger.error(
        `Error generating signed URL for ${storagePath}:`,
        error,
      );
      return null;
    }
  }

  async createUserProfile(userId: string): Promise<User> {
    try {
      // Get user info from Firebase Auth
      const authUser = await this.userRepository.getUserById(userId);

      const user = await this.userRepository.createUser({
        uid: userId,
        email: authUser?.email || '',
        displayName: authUser?.displayName || undefined,
        photoURL: authUser?.photoURL || undefined,
      });

      return user;
    } catch (error) {
      this.logger.error(`Error creating user profile for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user profile with photo path (internal method for photo uploads)
   * Stores both the photoURL (for display) and profilePhotoPath (for URL regeneration)
   */
  private async updateUserProfileWithPath(
    userId: string,
    profile: {
      photoURL: string;
      profilePhotoPath: string;
    },
  ): Promise<User> {
    try {
      let user = await this.userRepository.getUser(userId);
      if (!user) {
        user = await this.createUserProfile(userId);
      }

      const updatedAt = new Date();
      const updates = {
        photoURL: profile.photoURL,
        profilePhotoPath: profile.profilePhotoPath,
        updatedAt,
      };

      // Update Firebase Auth with the signed URL (for display in other Firebase services)
      await Promise.all([
        this.userRepository.updateUser(userId, updates),
        this.firebaseService.auth.updateUser(userId, {
          photoURL: profile.photoURL,
        }),
      ]);

      return {
        ...user,
        ...updates,
      } as User;
    } catch (error) {
      this.logger.error(
        `Error updating profile with path for user ${userId}:`,
        error,
      );
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
        this.userRepository.updateUser(userId, updates),
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

      // Generate a fresh signed URL for immediate use
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days (max for V4)
      });

      // Store the storage path (not the signed URL) so we can regenerate URLs on demand
      // This prevents 400 errors when signed URLs expire after 7 days
      await this.updateUserProfileWithPath(userId, {
        photoURL: signedUrl, // For immediate display and Firebase Auth sync
        profilePhotoPath: filePath, // Permanent storage path for URL regeneration
      });

      // Delete old profile photo if it was a custom upload
      if (oldPhotoPath) {
        try {
          await bucket.file(oldPhotoPath).delete();
          this.logger.log(`Deleted old profile photo: ${oldPhotoPath}`);
        } catch {
          // Don't fail if old photo deletion fails
          this.logger.warn(
            `Failed to delete old profile photo: ${oldPhotoPath}`,
          );
        }
      }

      this.logger.log(
        `Profile photo uploaded for user ${userId}: ${signedUrl}`,
      );
      return signedUrl;
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
      const user = await this.userRepository.getUser(userId);

      // Use profilePhotoPath if available, otherwise try to extract from URL
      const filePath =
        user?.profilePhotoPath ||
        (user?.photoURL?.includes('profiles/') ||
        user?.photoURL?.includes('profile-photos/')
          ? this.extractPathFromUrl(user.photoURL)
          : null);

      if (filePath) {
        const bucket = this.firebaseService.storageService.bucket();
        try {
          await bucket.file(filePath).delete();
          this.logger.log(`Deleted profile photo: ${filePath}`);
        } catch {
          this.logger.warn(`Failed to delete profile photo: ${filePath}`);
        }
      }

      // Clear both photoURL and profilePhotoPath
      await Promise.all([
        this.userRepository.updateUser(userId, {
          photoURL: '',
          profilePhotoPath: '',
        }),
        this.firebaseService.auth.updateUser(userId, { photoURL: null }),
      ]);

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
      };

      await this.userRepository.updateUser(userId, updates);

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
      };

      await this.userRepository.updateUser(userId, updates);

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
      folders?: number;
      usageRecords?: number;
      importedConversations?: number;
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
        folders?: number;
        usageRecords?: number;
        importedConversations?: number;
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
          await this.userRepository.deleteUserTranscriptions(userId);
        deletedData.transcriptions = transcriptionsDeleted;

        // 2. Delete all generated analyses
        const analysesDeleted =
          await this.userRepository.deleteUserGeneratedAnalyses(userId);
        deletedData.analyses = analysesDeleted;

        // 3. Delete all folders
        const foldersDeleted =
          await this.userRepository.deleteUserFolders(userId);
        deletedData.folders = foldersDeleted;

        // 4. Delete all usage records
        const usageRecordsDeleted =
          await this.userRepository.deleteUserUsageRecords(userId);
        deletedData.usageRecords = usageRecordsDeleted;

        // 5. Delete all imported conversations
        const importedConversationsDeleted =
          await this.userRepository.deleteUserImportedConversations(userId);
        deletedData.importedConversations = importedConversationsDeleted;

        // 6. Delete all storage files
        const storageFilesDeleted =
          await this.storageService.deleteUserFiles(userId);
        deletedData.storageFiles = storageFilesDeleted;

        // 7. Cancel Stripe subscription and delete customer
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

        // 8. Delete Firestore user document
        await this.userRepository.deleteUser(userId);
        deletedData.firestoreUser = true;

        // 9. Delete Firebase Auth account (LAST - no going back after this!)
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

        await this.userRepository.softDeleteUser(userId);
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
