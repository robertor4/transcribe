import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase.service';
import { Transcription, PaginatedResponse } from '@transcribe/shared';
import { FolderRepository } from './folder.repository';

/**
 * Repository for transcription-related Firestore operations.
 * Handles transcription CRUD, search, and folder operations.
 */
@Injectable()
export class TranscriptionRepository {
  private readonly logger = new Logger(TranscriptionRepository.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly folderRepository: FolderRepository,
  ) {}

  private get db(): admin.firestore.Firestore {
    return this.firebaseService.firestore;
  }

  /**
   * Create a new transcription
   */
  async createTranscription(
    transcription: Omit<Transcription, 'id'>,
  ): Promise<string> {
    const docRef = await this.db
      .collection('transcriptions')
      .add(transcription);
    return docRef.id;
  }

  /**
   * Update a transcription
   */
  async updateTranscription(
    id: string,
    data: Partial<Transcription>,
  ): Promise<void> {
    await this.db.collection('transcriptions').doc(id).update(data);
  }

  /**
   * Clear file references from a transcription (after file deletion)
   */
  async clearTranscriptionFileReferences(id: string): Promise<void> {
    await this.db.collection('transcriptions').doc(id).update({
      fileUrl: admin.firestore.FieldValue.delete(),
      storagePath: admin.firestore.FieldValue.delete(),
    });
  }

  /**
   * Get a single transcription by ID
   */
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

    return this.mapTranscriptionData(doc.id, data);
  }

  /**
   * Get paginated transcriptions for a user
   */
  async getTranscriptions(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<Transcription>> {
    const offset = (page - 1) * pageSize;

    // Firestore can't efficiently filter for "field doesn't exist OR field is null"
    // So we fetch more records than needed and filter in memory
    const fetchLimit = page === 1 ? pageSize * 2 : offset + pageSize * 2;

    const snapshot = await this.db
      .collection('transcriptions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(fetchLimit)
      .get();

    // Filter out soft-deleted items
    const allDocs = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return !data.deletedAt;
    });

    // If we didn't get enough non-deleted docs, fetch all
    let finalDocs = allDocs;
    if (
      allDocs.length < offset + pageSize &&
      snapshot.docs.length === fetchLimit
    ) {
      const fullSnapshot = await this.db
        .collection('transcriptions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      finalDocs = fullSnapshot.docs.filter((doc) => {
        const data = doc.data();
        return !data.deletedAt;
      });
    }

    const total = finalDocs.length;
    const paginatedDocs = finalDocs.slice(offset, offset + pageSize);

    const items = paginatedDocs.map((doc) =>
      this.mapTranscriptionData(doc.id, doc.data()),
    );

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Search transcriptions by query string
   */
  async searchTranscriptions(
    userId: string,
    query: string,
    limit = 20,
  ): Promise<{ items: Partial<Transcription>[]; total: number }> {
    const normalizedQuery = query.toLowerCase().trim();

    const snapshot = await this.db
      .collection('transcriptions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const results = snapshot.docs.filter((doc) => {
      const data = doc.data();

      if (data.deletedAt) {
        return false;
      }

      const searchableFields: string[] = [
        data.title || '',
        data.fileName || '',
      ];

      // Add V2 summary fields if available
      if (data.summaryV2) {
        if (data.summaryV2.headline) {
          searchableFields.push(data.summaryV2.headline);
        }
        if (
          data.summaryV2.keyPoints &&
          Array.isArray(data.summaryV2.keyPoints)
        ) {
          for (const kp of data.summaryV2.keyPoints) {
            if (kp.topic) searchableFields.push(kp.topic);
            if (kp.description) searchableFields.push(kp.description);
          }
        }
        if (data.summaryV2.themes && Array.isArray(data.summaryV2.themes)) {
          searchableFields.push(...data.summaryV2.themes);
        }
      }

      // Check legacy summary fields
      if (data.coreAnalyses?.summaryV2) {
        const v2 = data.coreAnalyses.summaryV2;
        if (v2.headline) searchableFields.push(v2.headline);
        if (v2.keyPoints && Array.isArray(v2.keyPoints)) {
          for (const kp of v2.keyPoints) {
            if (kp.topic) searchableFields.push(kp.topic);
            if (kp.description) searchableFields.push(kp.description);
          }
        }
      }

      const searchableText = searchableFields.join(' ').toLowerCase();
      return searchableText.includes(normalizedQuery);
    });

    const total = results.length;
    const limitedResults = results.slice(0, limit);

    return {
      items: limitedResults.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || data.fileName || 'Untitled',
          fileName: data.fileName,
          status: data.status,
          folderId: data.folderId || null,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : data.createdAt,
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : data.updatedAt,
        };
      }),
      total,
    };
  }

  /**
   * Record that a user accessed/opened a transcription
   */
  async recordTranscriptionAccess(userId: string, id: string): Promise<void> {
    const doc = await this.db.collection('transcriptions').doc(id).get();

    if (!doc.exists) {
      throw new Error('Transcription not found');
    }

    const data = doc.data();
    if (!data || data.userId !== userId) {
      throw new Error('Transcription not found');
    }

    await this.db.collection('transcriptions').doc(id).update({
      lastAccessedAt: new Date(),
    });
  }

  /**
   * Get recently opened transcriptions for a user
   */
  async getRecentlyOpenedTranscriptions(
    userId: string,
    limit = 5,
  ): Promise<Transcription[]> {
    const snapshot = await this.db
      .collection('transcriptions')
      .where('userId', '==', userId)
      .orderBy('lastAccessedAt', 'desc')
      .limit(limit * 2)
      .get();

    const validDocs = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return !data.deletedAt && data.lastAccessedAt;
    });

    const limitedDocs = validDocs.slice(0, limit);

    return limitedDocs.map((doc) => {
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
        lastAccessedAt: data.lastAccessedAt?.toDate
          ? data.lastAccessedAt.toDate()
          : data.lastAccessedAt,
        sharedAt: data.sharedAt?.toDate
          ? data.sharedAt.toDate()
          : data.sharedAt,
        sharedWith: data.sharedWith?.map((record: any) => ({
          email: record.email,
          sentAt: record.sentAt?.toDate
            ? record.sentAt.toDate()
            : record.sentAt,
        })),
      } as Transcription;
    });
  }

  /**
   * Delete a transcription (hard delete)
   */
  async deleteTranscription(id: string): Promise<void> {
    await this.db.collection('transcriptions').doc(id).delete();
  }

  /**
   * Get transcription by share token (for public access)
   */
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
    return this.mapTranscriptionData(doc.id, doc.data());
  }

  /**
   * Delete share info from a transcription
   */
  async deleteShareInfo(transcriptionId: string): Promise<void> {
    await this.db.collection('transcriptions').doc(transcriptionId).update({
      shareToken: admin.firestore.FieldValue.delete(),
      shareSettings: admin.firestore.FieldValue.delete(),
      sharedAt: admin.firestore.FieldValue.delete(),
      sharedWith: admin.firestore.FieldValue.delete(),
      updatedAt: new Date(),
    });
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
      // Get unfiled transcriptions
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return !data.folderId && !data.deletedAt;
        })
        .map((doc) => this.mapTranscriptionData(doc.id, doc.data()));
    } else {
      query = query.where('folderId', '==', folderId);
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs
        .filter((doc) => !doc.data().deletedAt)
        .map((doc) => this.mapTranscriptionData(doc.id, doc.data()));
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
    const [transcription, folder] = await Promise.all([
      this.getTranscription(userId, transcriptionId),
      folderId
        ? this.folderRepository.getFolder(userId, folderId)
        : Promise.resolve(null),
    ]);

    if (!transcription) {
      throw new Error('Transcription not found or access denied');
    }

    if (folderId && !folder) {
      throw new Error('Folder not found or access denied');
    }

    await this.updateTranscription(transcriptionId, {
      folderId: folderId,
    });

    this.logger.log(
      `Moved transcription ${transcriptionId} to folder ${folderId || 'none'}`,
    );
  }

  /**
   * Helper to map Firestore data to Transcription object
   */
  private mapTranscriptionData(
    id: string,
    data: admin.firestore.DocumentData,
  ): Transcription {
    return {
      ...data,
      id,
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
