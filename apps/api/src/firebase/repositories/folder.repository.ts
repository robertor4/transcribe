import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase.service';
import {
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
} from '@transcribe/shared';

/**
 * Repository for folder-related Firestore operations.
 * Handles folder CRUD and conversation associations.
 */
@Injectable()
export class FolderRepository {
  private readonly logger = new Logger(FolderRepository.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebaseService.firestore;
  }

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
   * Get all folders for a user with conversation counts
   */
  async getUserFolders(userId: string): Promise<Folder[]> {
    // Get folders and transcriptions in parallel for efficiency
    const [foldersSnapshot, transcriptionsSnapshot] = await Promise.all([
      this.db
        .collection('folders')
        .where('userId', '==', userId)
        .orderBy('sortOrder', 'asc')
        .orderBy('createdAt', 'asc')
        .get(),
      this.db
        .collection('transcriptions')
        .where('userId', '==', userId)
        .select('folderId', 'deletedAt') // Only fetch needed fields
        .get(),
    ]);

    // Count conversations per folder (excluding soft-deleted)
    const folderCounts = new Map<string, number>();
    for (const doc of transcriptionsSnapshot.docs) {
      const data = doc.data();
      if (data.folderId && !data.deletedAt) {
        folderCounts.set(
          data.folderId,
          (folderCounts.get(data.folderId) || 0) + 1,
        );
      }
    }

    return foldersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        color: data.color,
        sortOrder: data.sortOrder,
        conversationCount: folderCounts.get(doc.id) || 0,
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

    // Use batch writes for better performance (max 500 per batch)
    const batchSize = 500;
    const now = new Date();

    for (let i = 0; i < transcriptions.length; i += batchSize) {
      const batch = this.db.batch();
      const chunk = transcriptions.slice(i, i + batchSize);

      for (const t of chunk) {
        const docRef = this.db.collection('transcriptions').doc(t.id);
        if (deleteContents) {
          // Soft delete: mark transcriptions as deleted
          batch.update(docRef, {
            deletedAt: now,
            folderId: null, // Clear folder reference
          });
        } else {
          // Move to unfiled: just clear the folder reference
          batch.update(docRef, { folderId: null });
        }
      }

      await batch.commit();
    }

    if (deleteContents) {
      this.logger.log(
        `Soft-deleted ${transcriptions.length} transcriptions from folder ${folderId}`,
      );
    } else {
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
   * Get transcriptions in a specific folder (minimal version for folder operations)
   */
  private async getTranscriptionsByFolder(
    userId: string,
    folderId: string,
  ): Promise<{ id: string }[]> {
    const query = this.db
      .collection('transcriptions')
      .where('userId', '==', userId)
      .where('folderId', '==', folderId)
      .select(); // Only need document IDs

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id }));
  }
}
