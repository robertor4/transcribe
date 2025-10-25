import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  Transcription,
  PaginatedResponse,
  TranscriptionStatus,
  SummaryComment,
  GeneratedAnalysis,
} from '@transcribe/shared';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private db: admin.firestore.Firestore;
  private storage: admin.storage.Storage;

  constructor(private configService: ConfigService) {}

  get firestore(): admin.firestore.Firestore {
    return this.db;
  }

  get auth(): admin.auth.Auth {
    return admin.auth();
  }

  onModuleInit() {
    if (!admin.apps.length) {
      // Use the storage bucket from env, which should be transcribe-52b6f.firebasestorage.app
      const storageBucket = this.configService.get<string>(
        'FIREBASE_STORAGE_BUCKET',
      );

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          privateKey: this.configService
            .get<string>('FIREBASE_PRIVATE_KEY')
            ?.replace(/\\n/g, '\n'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        }),
        storageBucket: storageBucket,
      });

      this.logger.log(
        `Firebase initialized with storage bucket: ${storageBucket}`,
      );
    }

    this.db = admin.firestore();
    this.storage = admin.storage();
    this.logger.log('Firebase initialized');
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      this.logger.error('Error verifying Firebase ID token:', error);
      throw error;
    }
  }

  async createTranscription(
    transcription: Omit<Transcription, 'id'>,
  ): Promise<string> {
    const docRef = await this.db
      .collection('transcriptions')
      .add(transcription);
    return docRef.id;
  }

  async updateTranscription(id: string, data: Partial<Transcription>) {
    await this.db.collection('transcriptions').doc(id).update(data);
  }

  async clearTranscriptionFileReferences(id: string) {
    // Use FieldValue.delete() to remove fields from the document
    await this.db.collection('transcriptions').doc(id).update({
      fileUrl: admin.firestore.FieldValue.delete(),
      storagePath: admin.firestore.FieldValue.delete(),
    });
  }

  async getTranscription(
    userId: string,
    id: string,
  ): Promise<Transcription | null> {
    const doc = await this.db.collection('transcriptions').doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    if (!data || data.userId !== userId) {
      return null;
    }

    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
      completedAt: data.completedAt?.toDate
        ? data.completedAt.toDate()
        : data.completedAt,
      sharedAt: data.sharedAt?.toDate ? data.sharedAt.toDate() : data.sharedAt,
      sharedWith: data.sharedWith?.map((record: any) => ({
        email: record.email,
        sentAt: record.sentAt?.toDate ? record.sentAt.toDate() : record.sentAt,
      })),
    } as Transcription;
  }

  async getTranscriptions(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<Transcription>> {
    const offset = (page - 1) * pageSize;

    const countSnapshot = await this.db
      .collection('transcriptions')
      .where('userId', '==', userId)
      .count()
      .get();

    const total = countSnapshot.data().count;

    const snapshot = await this.db
      .collection('transcriptions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .offset(offset)
      .get();

    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt,
        completedAt: data.completedAt?.toDate
          ? data.completedAt.toDate()
          : data.completedAt,
        sharedAt: data.sharedAt?.toDate
          ? data.sharedAt.toDate()
          : data.sharedAt,
        sharedWith: data.sharedWith?.map((record: any) => ({
          email: record.email,
          sentAt: record.sentAt?.toDate
            ? record.sentAt.toDate()
            : record.sentAt,
        })),
      };
    }) as Transcription[];

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total,
    };
  }

  async deleteTranscription(id: string) {
    await this.db.collection('transcriptions').doc(id).delete();
  }

  async uploadFile(
    buffer: Buffer,
    path: string,
    contentType: string,
  ): Promise<{ url: string; path: string }> {
    const bucket = this.storage.bucket();
    const file = bucket.file(path);

    this.logger.log(
      `Uploading file to storage: ${path}, size: ${buffer.length} bytes`,
    );

    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    this.logger.log(`File saved successfully: ${path}`);

    // Verify the file exists
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File upload verification failed: ${path}`);
    }

    // Generate signed URL with long expiration
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    this.logger.log(`Generated signed URL for: ${path}`);

    return { url, path };
  }

  async uploadText(text: string, path: string): Promise<string> {
    const buffer = Buffer.from(text, 'utf-8');
    const result = await this.uploadFile(buffer, path, 'text/plain');
    return result.url;
  }

  async getPublicUrl(url: string): Promise<string> {
    // Extract file path from the existing URL and create a new signed URL
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      const bucketName = this.configService.get<string>(
        'FIREBASE_STORAGE_BUCKET',
      );
      const bucketIndex = pathParts.findIndex(
        (part) =>
          part === bucketName ||
          part.includes('.firebasestorage.app') ||
          part.includes('.appspot.com'),
      );

      let filePath: string;
      if (bucketIndex !== -1) {
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      } else {
        const nonEmptyParts = pathParts.filter((p) => p);
        filePath = nonEmptyParts.slice(1).join('/');
      }

      // Decode the file path
      filePath = decodeURIComponent(filePath);

      this.logger.log(`Creating public URL for file: ${filePath}`);
      this.logger.log(`Original URL: ${url}`);

      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        this.logger.error(`File does not exist in storage: ${filePath}`);
        throw new Error(`File not found in storage: ${filePath}`);
      }

      // Generate a new signed URL with long expiration for AssemblyAI
      const [publicUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      });

      this.logger.log(`Generated public URL: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      this.logger.error('Error creating public URL:', error);
      throw error;
    }
  }

  async downloadFile(url: string): Promise<Buffer> {
    // Extract file path from signed URL
    // The URL format is: https://storage.googleapis.com/bucket-name/path/to/file?signature...
    // We need to extract just the path/to/file part

    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // Remove empty string and bucket name from path parts
      // pathname format: /bucket-name/path/to/file
      const bucketName = this.configService.get<string>(
        'FIREBASE_STORAGE_BUCKET',
      );
      const bucketIndex = pathParts.findIndex(
        (part) =>
          part === bucketName ||
          part.includes('.firebasestorage.app') ||
          part.includes('.appspot.com'),
      );

      let filePath: string;
      if (bucketIndex !== -1) {
        // Found bucket name in path, take everything after it
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      } else {
        // Fallback: assume first non-empty part is bucket, take rest
        const nonEmptyParts = pathParts.filter((p) => p);
        filePath = nonEmptyParts.slice(1).join('/');
      }

      // Decode the file path (handles URL encoding like %20 for spaces)
      filePath = decodeURIComponent(filePath);

      this.logger.log(`Downloading file from path: ${filePath}`);

      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);
      const [buffer] = await file.download();

      return buffer;
    } catch (error) {
      this.logger.error('Error parsing file URL or downloading:', error);
      this.logger.error('Original URL:', url);
      throw error;
    }
  }

  async deleteFileByPath(path: string) {
    try {
      const bucket = this.storage.bucket();
      const file = bucket.file(path);
      await file.delete();
      this.logger.log(`Successfully deleted file by path: ${path}`);
    } catch (error: any) {
      // Check if the error is a 404 (file not found)
      if (error?.code === 404 || error?.message?.includes('No such object')) {
        this.logger.warn(
          `File already deleted or doesn't exist at path: ${path}`,
        );
        // Don't throw - this is not a critical error
        return;
      }
      // For other errors, log and re-throw
      this.logger.error('Error deleting file by path:', error);
      throw error;
    }
  }

  async deleteFile(url: string) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      const bucketName = this.configService.get<string>(
        'FIREBASE_STORAGE_BUCKET',
      );
      const bucketIndex = pathParts.findIndex(
        (part) =>
          part === bucketName ||
          part.includes('.firebasestorage.app') ||
          part.includes('.appspot.com'),
      );

      let filePath: string;
      if (bucketIndex !== -1) {
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      } else {
        const nonEmptyParts = pathParts.filter((p) => p);
        filePath = nonEmptyParts.slice(1).join('/');
      }

      filePath = decodeURIComponent(filePath);

      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);
      await file.delete();
      this.logger.log(`Successfully deleted file: ${filePath}`);
    } catch (error: any) {
      // Check if the error is a 404 (file not found)
      if (error?.code === 404 || error?.message?.includes('No such object')) {
        this.logger.warn(`File already deleted or doesn't exist: ${url}`);
        // Don't throw - this is not a critical error
        return;
      }
      // For other errors, log and re-throw
      this.logger.error('Error deleting file:', error);
      throw error;
    }
  }

  // OLD createUser and getUser methods removed - see NEW implementations below (lines 579+)

  // Summary Comments CRUD Operations
  async addSummaryComment(
    transcriptionId: string,
    comment: Omit<SummaryComment, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const commentDoc = {
      ...comment,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await this.db
      .collection('transcriptions')
      .doc(transcriptionId)
      .collection('comments')
      .add(commentDoc);

    return docRef.id;
  }

  async getSummaryComments(transcriptionId: string): Promise<SummaryComment[]> {
    const snapshot = await this.db
      .collection('transcriptions')
      .doc(transcriptionId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        transcriptionId: data.transcriptionId,
        userId: data.userId,
        position: data.position,
        content: data.content,
        resolved: data.resolved,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  }

  async updateSummaryComment(
    transcriptionId: string,
    commentId: string,
    updates: Partial<SummaryComment>,
  ): Promise<void> {
    await this.db
      .collection('transcriptions')
      .doc(transcriptionId)
      .collection('comments')
      .doc(commentId)
      .update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
  }

  async deleteSummaryComment(
    transcriptionId: string,
    commentId: string,
  ): Promise<void> {
    await this.db
      .collection('transcriptions')
      .doc(transcriptionId)
      .collection('comments')
      .doc(commentId)
      .delete();
  }

  async getSummaryComment(
    transcriptionId: string,
    commentId: string,
  ): Promise<SummaryComment | null> {
    const doc = await this.db
      .collection('transcriptions')
      .doc(transcriptionId)
      .collection('comments')
      .doc(commentId)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      transcriptionId: data?.transcriptionId || '',
      userId: data?.userId || '',
      position: data?.position || { section: '' },
      content: data?.content || '',
      resolved: data?.resolved,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    };
  }

  async getTranscriptionByShareToken(
    shareToken: string,
  ): Promise<Transcription | null> {
    const snapshot = await this.db
      .collection('transcriptions')
      .where('shareToken', '==', shareToken)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
      completedAt: data.completedAt?.toDate
        ? data.completedAt.toDate()
        : data.completedAt,
      sharedAt: data.sharedAt?.toDate ? data.sharedAt.toDate() : data.sharedAt,
      sharedWith: data.sharedWith?.map((record: any) => ({
        email: record.email,
        sentAt: record.sentAt?.toDate ? record.sentAt.toDate() : record.sentAt,
      })),
    } as Transcription;
  }

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

  // NEW: Get full user data from Firestore (including subscription info)
  async getUser(userId: string): Promise<any> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return null;
      }
      return { uid: userId, ...userDoc.data() };
    } catch (error) {
      this.logger.error(`Error fetching user from Firestore ${userId}:`, error);
      return null;
    }
  }

  // NEW: Create user document in Firestore
  async createUser(userData: any): Promise<void> {
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

      await this.db.collection('users').doc(userData.uid).set({
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
      });
      this.logger.log(`Created user document for ${userData.uid}`);
    } catch (error) {
      this.logger.error(`Error creating user document:`, error);
      throw error;
    }
  }

  // NEW: Update user document in Firestore
  async updateUser(userId: string, updates: any): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).update({
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  // NEW: Soft delete user (mark as deleted, preserve data)
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

  // NEW: Hard delete user document from Firestore
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).delete();
      this.logger.log(`Hard deleted user document for ${userId}`);
    } catch (error) {
      this.logger.error(`Error hard deleting user ${userId}:`, error);
      throw error;
    }
  }

  // NEW: Delete all user transcriptions
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

  // NEW: Delete all user generated analyses
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

  // NEW: Delete all user storage files
  async deleteUserStorageFiles(userId: string): Promise<number> {
    try {
      const bucket = this.storage.bucket();
      const [files] = await bucket.getFiles({ prefix: `users/${userId}/` });

      let deletedCount = 0;
      for (const file of files) {
        await file.delete();
        deletedCount++;
      }

      this.logger.log(`Deleted ${deletedCount} storage files for user ${userId}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Error deleting storage files for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  // NEW: Get user by Stripe customer ID
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
      this.logger.error(`Error fetching user by Stripe customer ID ${customerId}:`, error);
      return null;
    }
  }

  // NEW: Get all users (for migration/batch operations)
  async getAllUsers(): Promise<any[]> {
    try {
      const snapshot = await this.db.collection('users').get();
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
          deletedAt: data.deletedAt?.toDate
            ? data.deletedAt.toDate()
            : data.deletedAt,
          currentPeriodStart: data.currentPeriodStart?.toDate
            ? data.currentPeriodStart.toDate()
            : data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd?.toDate
            ? data.currentPeriodEnd.toDate()
            : data.currentPeriodEnd,
        };
      });
    } catch (error) {
      this.logger.error('Error fetching all users:', error);
      return [];
    }
  }

  // NEW: Get users by subscription tier
  async getUsersByTier(tier: string): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .where('subscriptionTier', '==', tier)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
          deletedAt: data.deletedAt?.toDate
            ? data.deletedAt.toDate()
            : data.deletedAt,
          currentPeriodStart: data.currentPeriodStart?.toDate
            ? data.currentPeriodStart.toDate()
            : data.currentPeriodStart,
          currentPeriodEnd: data.currentPeriodEnd?.toDate
            ? data.currentPeriodEnd.toDate()
            : data.currentPeriodEnd,
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching users by tier ${tier}:`, error);
      return [];
    }
  }

  async deleteShareInfo(transcriptionId: string): Promise<void> {
    await this.db.collection('transcriptions').doc(transcriptionId).update({
      shareToken: admin.firestore.FieldValue.delete(),
      shareSettings: admin.firestore.FieldValue.delete(),
      sharedAt: admin.firestore.FieldValue.delete(),
      sharedWith: admin.firestore.FieldValue.delete(),
      updatedAt: new Date(),
    });
  }

  // ============================================================
  // GENERATED ANALYSES METHODS (On-Demand Analysis System)
  // ============================================================

  /**
   * Create a generated analysis record
   */
  async createGeneratedAnalysis(analysis: Omit<any, 'id'>): Promise<string> {
    const docRef = await this.db.collection('generatedAnalyses').add({
      ...analysis,
      generatedAt: admin.firestore.Timestamp.fromDate(analysis.generatedAt),
    });
    return docRef.id;
  }

  /**
   * Get all generated analyses for a transcription
   */
  async getGeneratedAnalyses(
    transcriptionId: string,
    userId: string,
  ): Promise<any[]> {
    const snapshot = await this.db
      .collection('generatedAnalyses')
      .where('transcriptionId', '==', transcriptionId)
      .where('userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        generatedAt: data.generatedAt?.toDate
          ? data.generatedAt.toDate()
          : data.generatedAt,
      };
    });
  }

  /**
   * Get a single generated analysis by ID
   */
  async getGeneratedAnalysisById(analysisId: string): Promise<any | null> {
    const doc = await this.db
      .collection('generatedAnalyses')
      .doc(analysisId)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }
    return {
      id: doc.id,
      ...data,
      generatedAt: data.generatedAt?.toDate
        ? data.generatedAt.toDate()
        : data.generatedAt,
    };
  }

  /**
   * Update a generated analysis document
   */
  async updateGeneratedAnalysis(
    analysisId: string,
    data: any,
  ): Promise<void> {
    await this.db
      .collection('generatedAnalyses')
      .doc(analysisId)
      .update(data);
  }

  /**
   * Delete a generated analysis
   */
  async deleteGeneratedAnalysis(analysisId: string): Promise<void> {
    await this.db.collection('generatedAnalyses').doc(analysisId).delete();
  }

  /**
   * Add analysis reference to transcription
   */
  async addAnalysisReference(
    transcriptionId: string,
    analysisId: string,
  ): Promise<void> {
    await this.db
      .collection('transcriptions')
      .doc(transcriptionId)
      .update({
        generatedAnalysisIds: admin.firestore.FieldValue.arrayUnion(analysisId),
      });
  }

  /**
   * Remove analysis reference from transcription
   */
  async removeAnalysisReference(
    transcriptionId: string,
    analysisId: string,
  ): Promise<void> {
    await this.db
      .collection('transcriptions')
      .doc(transcriptionId)
      .update({
        generatedAnalysisIds:
          admin.firestore.FieldValue.arrayRemove(analysisId),
      });
  }
}
