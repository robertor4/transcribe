import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase.service';
import { SummaryComment } from '@transcribe/shared';

/**
 * Repository for summary comment operations.
 * Handles comments stored as subcollections under transcriptions.
 */
@Injectable()
export class CommentRepository {
  private readonly logger = new Logger(CommentRepository.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebaseService.firestore;
  }

  /**
   * Add a new comment to a transcription
   */
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

    this.logger.debug(
      `Added comment ${docRef.id} to transcription ${transcriptionId}`,
    );
    return docRef.id;
  }

  /**
   * Get all comments for a transcription
   */
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

  /**
   * Get a single comment by ID
   */
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

  /**
   * Update a comment
   */
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

    this.logger.debug(
      `Updated comment ${commentId} in transcription ${transcriptionId}`,
    );
  }

  /**
   * Delete a comment
   */
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

    this.logger.debug(
      `Deleted comment ${commentId} from transcription ${transcriptionId}`,
    );
  }
}
