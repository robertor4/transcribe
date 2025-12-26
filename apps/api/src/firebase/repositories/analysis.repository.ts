import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase.service';

/**
 * Repository for generated analysis-related Firestore operations.
 * Handles analysis CRUD and references to transcriptions.
 */
@Injectable()
export class AnalysisRepository {
  private readonly logger = new Logger(AnalysisRepository.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebaseService.firestore;
  }

  /**
   * Convert Firestore timestamps to JS Dates in analysis data
   */
  private mapAnalysisDates(
    data: admin.firestore.DocumentData,
    id: string,
  ): any {
    return {
      id,
      ...data,
      generatedAt: data.generatedAt?.toDate?.()
        ? data.generatedAt.toDate()
        : data.generatedAt,
    };
  }

  /**
   * Create a generated analysis record
   * @returns The created analysis ID
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

    return snapshot.docs.map((doc) =>
      this.mapAnalysisDates(doc.data(), doc.id),
    );
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

    return this.mapAnalysisDates(data, doc.id);
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
   * @returns Array of deleted analysis IDs
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
   * Get recent generated analyses for a user across all conversations
   * @param userId - User ID to query
   * @param limit - Maximum number of analyses to return (default: 8)
   * @returns Array of GeneratedAnalysis with conversationTitle
   */
  async getRecentGeneratedAnalyses(
    userId: string,
    limit: number = 8,
  ): Promise<any[]> {
    try {
      // Get recent analyses
      const analysesSnapshot = await this.db
        .collection('generatedAnalyses')
        .where('userId', '==', userId)
        .orderBy('generatedAt', 'desc')
        .limit(limit)
        .get();

      if (analysesSnapshot.empty) {
        return [];
      }

      // Get unique transcription IDs
      const transcriptionIds = [
        ...new Set(
          analysesSnapshot.docs.map((doc) => doc.data().transcriptionId),
        ),
      ];

      // Batch fetch transcriptions for titles
      const transcriptionTitles = new Map<string, string>();
      for (const transcriptionId of transcriptionIds) {
        const transcriptionDoc = await this.db
          .collection('transcriptions')
          .doc(transcriptionId)
          .get();
        if (transcriptionDoc.exists) {
          const data = transcriptionDoc.data();
          transcriptionTitles.set(
            transcriptionId,
            data?.title || data?.fileName || 'Untitled',
          );
        }
      }

      // Map analyses with conversation titles
      return analysesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...this.mapAnalysisDates(data, doc.id),
          conversationTitle:
            transcriptionTitles.get(data.transcriptionId) || 'Untitled',
        };
      });
    } catch (error: any) {
      this.logger.error(
        `Error fetching recent generated analyses: ${error.message}`,
      );
      // If composite index doesn't exist, Firestore will provide a link to create it
      return [];
    }
  }

  /**
   * Get recent generated analyses for conversations in a specific folder
   * @param userId - User ID to query
   * @param folderId - Folder ID to filter by
   * @param limit - Maximum number of analyses to return (default: 8)
   * @returns Array of GeneratedAnalysis with conversationTitle
   */
  async getRecentGeneratedAnalysesByFolder(
    userId: string,
    folderId: string,
    limit: number = 8,
  ): Promise<any[]> {
    try {
      // First, get all transcription IDs in this folder
      const transcriptionsSnapshot = await this.db
        .collection('transcriptions')
        .where('userId', '==', userId)
        .where('folderId', '==', folderId)
        .select('id', 'title', 'fileName')
        .get();

      if (transcriptionsSnapshot.empty) {
        return [];
      }

      // Build a map of transcription IDs to titles
      const transcriptionMap = new Map<string, string>();
      transcriptionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        transcriptionMap.set(doc.id, data.title || data.fileName || 'Untitled');
      });

      const transcriptionIds = Array.from(transcriptionMap.keys());

      // Firestore 'in' queries support max 30 items, so chunk if needed
      const chunkSize = 30;
      const allAnalyses: any[] = [];

      for (let i = 0; i < transcriptionIds.length; i += chunkSize) {
        const chunk = transcriptionIds.slice(i, i + chunkSize);

        const analysesSnapshot = await this.db
          .collection('generatedAnalyses')
          .where('userId', '==', userId)
          .where('transcriptionId', 'in', chunk)
          .orderBy('generatedAt', 'desc')
          .limit(limit)
          .get();

        analysesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          allAnalyses.push({
            ...this.mapAnalysisDates(data, doc.id),
            conversationTitle:
              transcriptionMap.get(data.transcriptionId) || 'Untitled',
          });
        });
      }

      // Sort all results by generatedAt desc and take top 'limit'
      return allAnalyses
        .sort(
          (a, b) =>
            new Date(b.generatedAt).getTime() -
            new Date(a.generatedAt).getTime(),
        )
        .slice(0, limit);
    } catch (error: any) {
      this.logger.error(`Error fetching folder analyses: ${error.message}`);
      return [];
    }
  }
}
