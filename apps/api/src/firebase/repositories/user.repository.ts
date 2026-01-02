import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase.service';

/**
 * Repository for user-related Firestore operations.
 * Handles user CRUD, subscription lookups, and admin queries.
 */
@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebaseService.firestore;
  }

  private get auth(): admin.auth.Auth {
    return this.firebaseService.auth;
  }

  /**
   * Convert Firestore timestamps to JS Dates in user data
   */
  private mapUserDates(data: admin.firestore.DocumentData, uid: string): any {
    return {
      uid,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
      deletedAt: data.deletedAt?.toDate?.() ?? data.deletedAt,
      lastLogin: data.lastLogin?.toDate?.() ?? data.lastLogin,
      currentPeriodStart:
        data.currentPeriodStart?.toDate?.() ?? data.currentPeriodStart,
      currentPeriodEnd:
        data.currentPeriodEnd?.toDate?.() ?? data.currentPeriodEnd,
    };
  }

  /**
   * Get user from Firebase Auth only (basic auth data, no subscription info)
   * @deprecated Use getUser() for full user data including subscription
   */
  async getUserById(userId: string): Promise<any> {
    try {
      const userRecord = await this.auth.getUser(userId);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
      };
    } catch (error) {
      this.logger.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get full user data from Firestore (including subscription info)
   * This is the preferred method for getting user data.
   */
  async getUser(userId: string): Promise<any> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return null;
      }
      const data = userDoc.data();
      if (!data) {
        return null;
      }
      return this.mapUserDates(data, userId);
    } catch (error) {
      this.logger.error(`Error fetching user from Firestore ${userId}:`, error);
      return null;
    }
  }

  /**
   * Create user document in Firestore
   * @returns The created user data
   */
  async createUser(userData: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<any> {
    try {
      // Filter out undefined values to avoid Firestore validation errors
      const filteredUserData = Object.entries(userData).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {} as any,
      );

      const userDoc = {
        ...filteredUserData,
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

      await this.db.collection('users').doc(userData.uid).set(userDoc);
      this.logger.log(`Created user document for ${userData.uid}`);

      return { uid: userData.uid, ...userDoc };
    } catch (error) {
      this.logger.error(`Error creating user document:`, error);
      throw error;
    }
  }

  /**
   * Update user document in Firestore
   */
  async updateUser(userId: string, updates: any): Promise<void> {
    try {
      await this.db
        .collection('users')
        .doc(userId)
        .update({
          ...updates,
          updatedAt: new Date(),
        });
    } catch (error) {
      this.logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete user (mark as deleted, preserve data for GDPR)
   */
  async softDeleteUser(userId: string): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).update({
        deletedAt: new Date(),
        isDeleted: true,
        updatedAt: new Date(),
      });
      this.logger.log(`Soft deleted user document for ${userId}`);
    } catch (error) {
      this.logger.error(`Error soft deleting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Hard delete user document from Firestore
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).delete();
      this.logger.log(`Hard deleted user document for ${userId}`);
    } catch (error) {
      this.logger.error(`Error hard deleting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user by Stripe customer ID
   */
  async getUserByStripeCustomerId(customerId: string): Promise<any> {
    try {
      const snapshot = await this.db
        .collection('users')
        .where('stripeCustomerId', '==', customerId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { uid: doc.id, ...doc.data() };
    } catch (error) {
      this.logger.error(
        `Error fetching user by Stripe customer ID ${customerId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get all users (for migration/batch operations)
   */
  async getAllUsers(): Promise<any[]> {
    try {
      const snapshot = await this.db.collection('users').get();
      return snapshot.docs.map((doc) => this.mapUserDates(doc.data(), doc.id));
    } catch (error) {
      this.logger.error('Error fetching all users:', error);
      return [];
    }
  }

  /**
   * Get users by subscription tier
   */
  async getUsersByTier(tier: string): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .where('subscriptionTier', '==', tier)
        .get();

      return snapshot.docs.map((doc) => this.mapUserDates(doc.data(), doc.id));
    } catch (error) {
      this.logger.error(`Error fetching users by tier ${tier}:`, error);
      return [];
    }
  }

  /**
   * Delete all user transcriptions (batch operation for account deletion)
   */
  async deleteUserTranscriptions(userId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('transcriptions')
        .where('userId', '==', userId)
        .get();

      let deletedCount = 0;
      const batch = this.db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      this.logger.log(
        `Deleted ${deletedCount} transcriptions for user ${userId}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Error deleting transcriptions for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete all user generated analyses (batch operation for account deletion)
   */
  async deleteUserGeneratedAnalyses(userId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('generatedAnalyses')
        .where('userId', '==', userId)
        .get();

      let deletedCount = 0;
      const batch = this.db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      this.logger.log(
        `Deleted ${deletedCount} generated analyses for user ${userId}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Error deleting generated analyses for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete all user folders (batch operation for account deletion)
   */
  async deleteUserFolders(userId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('folders')
        .where('userId', '==', userId)
        .get();

      let deletedCount = 0;
      const batch = this.db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      this.logger.log(`Deleted ${deletedCount} folders for user ${userId}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Error deleting folders for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all user usage records (batch operation for account deletion)
   */
  async deleteUserUsageRecords(userId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('usageRecords')
        .where('userId', '==', userId)
        .get();

      let deletedCount = 0;
      const batch = this.db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      this.logger.log(
        `Deleted ${deletedCount} usage records for user ${userId}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Error deleting usage records for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete all user imported conversations (batch operation for account deletion)
   */
  async deleteUserImportedConversations(userId: string): Promise<number> {
    try {
      const snapshot = await this.db
        .collection('importedConversations')
        .where('userId', '==', userId)
        .get();

      let deletedCount = 0;
      const batch = this.db.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      await batch.commit();
      this.logger.log(
        `Deleted ${deletedCount} imported conversations for user ${userId}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Error deleting imported conversations for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  // ============================================================
  // ADMIN METHODS
  // ============================================================

  /**
   * Get user transcriptions for admin activity audit
   */
  async getUserTranscriptionsForAdmin(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('transcriptions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
          completedAt: data.completedAt?.toDate?.() ?? data.completedAt,
        };
      });
    } catch (error: any) {
      this.logger.error(`Error fetching user transcriptions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get user generated analyses for admin activity audit
   */
  async getUserAnalysesForAdmin(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('generatedAnalyses')
        .where('userId', '==', userId)
        .orderBy('generatedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          generatedAt: data.generatedAt?.toDate?.() ?? data.generatedAt,
        };
      });
    } catch (error: any) {
      this.logger.error(`Error fetching user analyses: ${error.message}`);
      return [];
    }
  }

  /**
   * Get user usage records for admin activity audit
   */
  async getUserUsageRecords(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('usageRecords')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
        };
      });
    } catch (error: any) {
      this.logger.error(`Error fetching usage records: ${error.message}`);
      return [];
    }
  }

  /**
   * Get comprehensive user activity for admin audit
   */
  async getUserActivity(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) {
      return null;
    }

    // Fetch all activity data in parallel
    const [transcriptions, analyses, usageRecords] = await Promise.all([
      this.getUserTranscriptionsForAdmin(userId, 50),
      this.getUserAnalysesForAdmin(userId, 50),
      this.getUserUsageRecords(userId, 50),
    ]);

    // Calculate summary statistics
    const totalHoursProcessed = transcriptions.reduce((sum, t) => {
      const durationHours = t.duration ? t.duration / 3600 : 0;
      return sum + durationHours;
    }, 0);

    const accountAge = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    // Build account events timeline
    const accountEvents: any[] = [];

    // Account creation event
    accountEvents.push({
      type: 'created',
      timestamp: user.createdAt,
      details: {
        email: user.email,
        displayName: user.displayName,
      },
    });

    // Last login event
    if (user.lastLogin) {
      accountEvents.push({
        type: 'login',
        timestamp: user.lastLogin,
        details: {
          email: user.email,
        },
      });
    }

    // Subscription/tier change events (inferred from current state)
    if (user.subscriptionTier && user.subscriptionTier !== 'free') {
      accountEvents.push({
        type: 'tier_change',
        timestamp: user.updatedAt || user.createdAt,
        details: {
          tier: user.subscriptionTier,
          status: user.subscriptionStatus,
        },
      });
    }

    // Deletion event
    if (user.isDeleted && user.deletedAt) {
      accountEvents.push({
        type: 'deletion',
        timestamp: user.deletedAt,
        details: {
          isDeleted: true,
        },
      });
    }

    // Sort events by timestamp (most recent first)
    accountEvents.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return {
      user,
      summary: {
        totalTranscriptions: transcriptions.length,
        totalHoursProcessed,
        totalAnalysesGenerated: analyses.length,
        accountAge,
        lastActive: user.lastLogin,
        monthlyUsage: {
          hours: user.usageThisMonth?.hours || 0,
          transcriptions: user.usageThisMonth?.transcriptions || 0,
          analyses: user.usageThisMonth?.onDemandAnalyses || 0,
        },
      },
      recentTranscriptions: transcriptions,
      recentAnalyses: analyses,
      usageRecords,
      accountEvents,
    };
  }
}
