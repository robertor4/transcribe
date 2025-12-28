import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase.service';
import { ImportedConversation } from '@transcribe/shared';

/**
 * Repository for imported conversation operations.
 * Handles CRUD for the importedConversations Firestore collection.
 */
@Injectable()
export class ImportedConversationRepository {
  private readonly logger = new Logger(ImportedConversationRepository.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebaseService.firestore;
  }

  /**
   * Convert Firestore document to ImportedConversation
   */
  private toImportedConversation(
    doc: admin.firestore.DocumentSnapshot,
  ): ImportedConversation | null {
    if (!doc.exists) return null;

    const data = doc.data();
    if (!data) return null;

    return {
      id: doc.id,
      userId: data.userId,
      shareToken: data.shareToken,
      originalTranscriptionId: data.originalTranscriptionId,
      title: data.title,
      sharedByName: data.sharedByName,
      sharedByEmail: data.sharedByEmail,
      expiresAt: data.expiresAt?.toDate
        ? data.expiresAt.toDate()
        : data.expiresAt,
      importedAt: data.importedAt?.toDate
        ? data.importedAt.toDate()
        : data.importedAt,
      lastAccessedAt: data.lastAccessedAt?.toDate
        ? data.lastAccessedAt.toDate()
        : data.lastAccessedAt,
      deletedAt: data.deletedAt?.toDate
        ? data.deletedAt.toDate()
        : data.deletedAt,
    };
  }

  /**
   * Create a new imported conversation
   */
  async create(
    data: Omit<ImportedConversation, 'id'>,
  ): Promise<ImportedConversation> {
    const docRef = await this.db.collection('importedConversations').add({
      ...data,
      importedAt: data.importedAt || new Date(),
    });

    this.logger.log(
      `Created imported conversation ${docRef.id} for user ${data.userId}`,
    );

    const doc = await docRef.get();
    return this.toImportedConversation(doc)!;
  }

  /**
   * Get an imported conversation by ID with ownership check
   */
  async getById(
    userId: string,
    id: string,
  ): Promise<ImportedConversation | null> {
    const doc = await this.db.collection('importedConversations').doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data || data.userId !== userId) {
      return null;
    }

    // Don't return soft-deleted imports
    if (data.deletedAt) {
      return null;
    }

    return this.toImportedConversation(doc);
  }

  /**
   * Check if user has already imported a share by its token
   */
  async getByShareToken(
    userId: string,
    shareToken: string,
  ): Promise<ImportedConversation | null> {
    const snapshot = await this.db
      .collection('importedConversations')
      .where('userId', '==', userId)
      .where('shareToken', '==', shareToken)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];

    // Return even if soft-deleted (to prevent re-importing)
    return this.toImportedConversation(doc);
  }

  /**
   * List all imports for a user (excluding soft-deleted)
   * Note: We sort client-side to avoid requiring a Firestore composite index
   */
  async listByUser(userId: string): Promise<ImportedConversation[]> {
    const snapshot = await this.db
      .collection('importedConversations')
      .where('userId', '==', userId)
      .get();

    const imports = snapshot.docs
      .map((doc) => this.toImportedConversation(doc))
      .filter(
        (item): item is ImportedConversation =>
          item !== null && !item.deletedAt,
      );

    // Sort by importedAt descending (newest first)
    return imports.sort((a, b) => {
      const dateA = a.importedAt ? new Date(a.importedAt).getTime() : 0;
      const dateB = b.importedAt ? new Date(b.importedAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  /**
   * Get count of imports for a user (excluding soft-deleted)
   */
  async getCountByUser(userId: string): Promise<number> {
    const snapshot = await this.db
      .collection('importedConversations')
      .where('userId', '==', userId)
      .select() // Only need count, not data
      .get();

    // Filter out soft-deleted in memory (Firestore doesn't support != in compound queries well)
    let count = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.deletedAt) {
        count++;
      }
    }

    return count;
  }

  /**
   * Soft delete an imported conversation
   */
  async softDelete(userId: string, id: string): Promise<void> {
    const existing = await this.getById(userId, id);
    if (!existing) {
      throw new Error('Imported conversation not found or access denied');
    }

    await this.db.collection('importedConversations').doc(id).update({
      deletedAt: new Date(),
    });

    this.logger.log(`Soft-deleted imported conversation ${id}`);
  }

  /**
   * Restore a soft-deleted import (useful for undo)
   */
  async restore(userId: string, id: string): Promise<void> {
    const doc = await this.db.collection('importedConversations').doc(id).get();

    if (!doc.exists) {
      throw new Error('Imported conversation not found');
    }

    const data = doc.data();
    if (!data || data.userId !== userId) {
      throw new Error('Access denied');
    }

    await this.db.collection('importedConversations').doc(id).update({
      deletedAt: admin.firestore.FieldValue.delete(),
    });

    this.logger.log(`Restored imported conversation ${id}`);
  }

  /**
   * Update the lastAccessedAt timestamp
   */
  async updateLastAccessed(id: string): Promise<void> {
    await this.db.collection('importedConversations').doc(id).update({
      lastAccessedAt: new Date(),
    });
  }

  /**
   * Hard delete an imported conversation (permanent)
   */
  async hardDelete(userId: string, id: string): Promise<void> {
    const existing = await this.getById(userId, id);
    if (!existing) {
      throw new Error('Imported conversation not found or access denied');
    }

    await this.db.collection('importedConversations').doc(id).delete();
    this.logger.log(`Hard-deleted imported conversation ${id}`);
  }
}
