import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  Transcription,
  PaginatedResponse,
  TranscriptionStatus,
  SummaryComment,
} from '@transcribe/shared';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private db: admin.firestore.Firestore;
  private storage: admin.storage.Storage;

  constructor(private configService: ConfigService) {}

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
  ): Promise<string> {
    const bucket = this.storage.bucket();
    const file = bucket.file(path);

    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    // Generate signed URL with long expiration
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return url;
  }

  async uploadText(text: string, path: string): Promise<string> {
    const buffer = Buffer.from(text, 'utf-8');
    return this.uploadFile(buffer, path, 'text/plain');
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
    } catch (error) {
      this.logger.error('Error deleting file:', error);
    }
  }

  async createUser(user: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }) {
    await this.db
      .collection('users')
      .doc(user.uid)
      .set(
        {
          ...user,
          role: 'user',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  }

  async getUser(uid: string) {
    const doc = await this.db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  }

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
}
