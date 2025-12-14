import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  Transcription,
  PaginatedResponse,
  TranscriptionStatus,
  SummaryComment,
  GeneratedAnalysis,
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
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

  /**
   * Extract identifier from file path for logging
   * Handles multiple path patterns:
   * - "transcriptions/userId/transcriptionId/file" -> "transcriptionId"
   * - "audio/userId/timestamp_filename" -> "timestamp_filename" (truncated)
   */
  private extractIdFromPath(path: string): string {
    // Try transcriptions path first: transcriptions/{userId}/{transcriptionId}/...
    const transcriptionMatch = path.match(/transcriptions\/[^\/]+\/([^\/]+)/);
    if (transcriptionMatch) {
      return transcriptionMatch[1];
    }

    // Try audio path: audio/{userId}/{timestamp}_{filename}
    const audioMatch = path.match(/audio\/[^\/]+\/(.+)/);
    if (audioMatch) {
      // Return truncated filename for readability
      const filename = audioMatch[1];
      return filename.length > 30
        ? filename.substring(0, 30) + '...'
        : filename;
    }

    // Fallback: return last path segment
    const segments = path.split('/').filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : 'unknown';
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

    const transcriptionId = this.extractIdFromPath(path);
    this.logger.log(
      `Generated signed URL for transcription ${transcriptionId}`,
    );

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

      const transcriptionId = this.extractIdFromPath(filePath);
      this.logger.log(
        `Creating public URL for transcription ${transcriptionId}`,
      );

      const bucket = this.storage.bucket();
      const file = bucket.file(filePath);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        this.logger.error(
          `File does not exist for transcription ${transcriptionId}: ${filePath}`,
        );
        throw new Error(`File not found in storage: ${filePath}`);
      }

      // Generate a new signed URL with long expiration for AssemblyAI
      const [publicUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      });

      this.logger.log(
        `Generated public URL for transcription ${transcriptionId}`,
      );

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

      const transcriptionId = this.extractIdFromPath(filePath);
      this.logger.log(`Downloading file for transcription ${transcriptionId}`);

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
      const transcriptionId = this.extractIdFromPath(path);
      const bucket = this.storage.bucket();
      const file = bucket.file(path);
      await file.delete();
      this.logger.log(
        `Successfully deleted file for transcription ${transcriptionId}`,
      );
    } catch (error: any) {
      // Check if the error is a 404 (file not found)
      if (error?.code === 404 || error?.message?.includes('No such object')) {
        const transcriptionId = this.extractIdFromPath(path);
        this.logger.warn(
          `File already deleted or doesn't exist for transcription ${transcriptionId}`,
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
      const data = userDoc.data();
      if (!data) {
        return null;
      }
      return {
        uid: userId,
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
        lastLogin: data.lastLogin?.toDate
          ? data.lastLogin.toDate()
          : data.lastLogin,
        currentPeriodStart: data.currentPeriodStart?.toDate
          ? data.currentPeriodStart.toDate()
          : data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd?.toDate
          ? data.currentPeriodEnd.toDate()
          : data.currentPeriodEnd,
      };
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

      await this.db
        .collection('users')
        .doc(userData.uid)
        .set({
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

      this.logger.log(
        `Deleted ${deletedCount} storage files for user ${userId}`,
      );
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
      this.logger.error(
        `Error fetching user by Stripe customer ID ${customerId}:`,
        error,
      );
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
          lastLogin: data.lastLogin?.toDate
            ? data.lastLogin.toDate()
            : data.lastLogin,
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
          lastLogin: data.lastLogin?.toDate
            ? data.lastLogin.toDate()
            : data.lastLogin,
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
  async updateGeneratedAnalysis(analysisId: string, data: any): Promise<void> {
    await this.db.collection('generatedAnalyses').doc(analysisId).update(data);
  }

  /**
   * Delete a generated analysis
   */
  async deleteGeneratedAnalysis(analysisId: string): Promise<void> {
    await this.db.collection('generatedAnalyses').doc(analysisId).delete();
  }

  /**
   * Delete all generated analyses for a transcription
   * Returns array of deleted analysis IDs
   */
  async deleteGeneratedAnalysesByTranscription(
    transcriptionId: string,
    userId: string,
  ): Promise<string[]> {
    const snapshot = await this.db
      .collection('generatedAnalyses')
      .where('transcriptionId', '==', transcriptionId)
      .where('userId', '==', userId)
      .get();

    const deletedIds: string[] = [];
    const deletePromises = snapshot.docs.map(async (doc) => {
      deletedIds.push(doc.id);
      await doc.ref.delete();
    });

    await Promise.all(deletePromises);
    return deletedIds;
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

  /**
   * Get user transcriptions for admin activity audit
   * @param userId - User ID to query
   * @param limit - Maximum number of transcriptions to return (default: 50)
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
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
          completedAt: data.completedAt?.toDate?.() || data.completedAt,
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching user transcriptions: ${error.message}`);
      // If composite index doesn't exist, return empty array
      // Firestore will provide a link to create the index in the error message
      return [];
    }
  }

  /**
   * Get user generated analyses for admin activity audit
   * @param userId - User ID to query
   * @param limit - Maximum number of analyses to return (default: 50)
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
          generatedAt: data.generatedAt?.toDate?.() || data.generatedAt,
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching user analyses: ${error.message}`);
      return [];
    }
  }

  /**
   * Get user usage records for admin activity audit
   * @param userId - User ID to query
   * @param limit - Maximum number of records to return (default: 50)
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
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching usage records: ${error.message}`);
      return [];
    }
  }

  /**
   * Get comprehensive user activity for admin audit
   * @param userId - User ID to query
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

  // ============================================================
  // FOLDER METHODS (V2 UI Support)
  // ============================================================

  /**
   * Create a new folder for a user
   */
  async createFolder(
    userId: string,
    data: CreateFolderRequest,
  ): Promise<string> {
    const now = new Date();
    const folderData = {
      userId,
      name: data.name,
      color: data.color || null,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.db.collection('folders').add(folderData);
    this.logger.log(`Created folder ${docRef.id} for user ${userId}`);
    return docRef.id;
  }

  /**
   * Get all folders for a user
   */
  async getUserFolders(userId: string): Promise<Folder[]> {
    const snapshot = await this.db
      .collection('folders')
      .where('userId', '==', userId)
      .orderBy('sortOrder', 'asc')
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        color: data.color,
        sortOrder: data.sortOrder,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt,
      } as Folder;
    });
  }

  /**
   * Get a single folder by ID
   */
  async getFolder(userId: string, folderId: string): Promise<Folder | null> {
    const doc = await this.db.collection('folders').doc(folderId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data || data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      color: data.color,
      sortOrder: data.sortOrder,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    } as Folder;
  }

  /**
   * Update a folder
   */
  async updateFolder(
    userId: string,
    folderId: string,
    data: UpdateFolderRequest,
  ): Promise<void> {
    const folder = await this.getFolder(userId, folderId);
    if (!folder) {
      throw new Error('Folder not found or access denied');
    }

    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    await this.db.collection('folders').doc(folderId).update(updateData);
    this.logger.log(`Updated folder ${folderId}`);
  }

  /**
   * Delete a folder
   * @param deleteContents - If true, soft-delete all conversations in the folder
   *                         If false, move conversations to unfiled (default)
   * @returns Object with deletedConversations count
   */
  async deleteFolder(
    userId: string,
    folderId: string,
    deleteContents: boolean = false,
  ): Promise<{ deletedConversations: number }> {
    const folder = await this.getFolder(userId, folderId);
    if (!folder) {
      throw new Error('Folder not found or access denied');
    }

    // Get all transcriptions in this folder
    const transcriptions = await this.getTranscriptionsByFolder(
      userId,
      folderId,
    );

    if (deleteContents) {
      // Soft delete: mark transcriptions as deleted
      const now = new Date();
      for (const t of transcriptions) {
        await this.updateTranscription(t.id, {
          deletedAt: now,
          folderId: null, // Clear folder reference
        });
      }
      this.logger.log(
        `Soft-deleted ${transcriptions.length} transcriptions from folder ${folderId}`,
      );
    } else {
      // Move to unfiled: just clear the folder reference
      for (const t of transcriptions) {
        await this.updateTranscription(t.id, { folderId: null });
      }
      this.logger.log(
        `Moved ${transcriptions.length} transcriptions to unfiled from folder ${folderId}`,
      );
    }

    // Delete the folder document
    await this.db.collection('folders').doc(folderId).delete();
    this.logger.log(`Deleted folder ${folderId}`);

    return { deletedConversations: transcriptions.length };
  }

  /**
   * Get transcriptions in a specific folder
   */
  async getTranscriptionsByFolder(
    userId: string,
    folderId: string | null,
  ): Promise<Transcription[]> {
    let query = this.db
      .collection('transcriptions')
      .where('userId', '==', userId);

    if (folderId === null) {
      // Get unfiled transcriptions (no folderId or folderId is null)
      // Firestore can't query for missing fields, so we query all and filter
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return !data.folderId;
        })
        .map((doc) => this.mapTranscriptionDoc(doc));
    } else {
      query = query.where('folderId', '==', folderId);
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map((doc) => this.mapTranscriptionDoc(doc));
    }
  }

  /**
   * Move a transcription to a folder (or remove from folder with null)
   */
  async moveToFolder(
    userId: string,
    transcriptionId: string,
    folderId: string | null,
  ): Promise<void> {
    const transcription = await this.getTranscription(userId, transcriptionId);
    if (!transcription) {
      throw new Error('Transcription not found or access denied');
    }

    // If moving to a folder, verify the folder exists and belongs to user
    if (folderId) {
      const folder = await this.getFolder(userId, folderId);
      if (!folder) {
        throw new Error('Folder not found or access denied');
      }
    }

    await this.updateTranscription(transcriptionId, {
      folderId: folderId,
    });
    this.logger.log(
      `Moved transcription ${transcriptionId} to folder ${folderId || 'none'}`,
    );
  }

  /**
   * Helper to map Firestore document to Transcription object
   */
  private mapTranscriptionDoc(
    doc: admin.firestore.QueryDocumentSnapshot,
  ): Transcription {
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
      sharedAt: data.sharedAt?.toDate ? data.sharedAt.toDate() : data.sharedAt,
      sharedWith: data.sharedWith?.map((record: any) => ({
        email: record.email,
        sentAt: record.sentAt?.toDate ? record.sentAt.toDate() : record.sentAt,
      })),
    } as Transcription;
  }
}
