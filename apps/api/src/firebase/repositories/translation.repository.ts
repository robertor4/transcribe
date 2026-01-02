import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase.service';
import { Translation, TranslatedContent } from '@transcribe/shared';

/**
 * Repository for translation-related Firestore operations.
 * Handles translations stored in the 'translations' collection.
 */
@Injectable()
export class TranslationRepository {
  private readonly logger = new Logger(TranslationRepository.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  private get db(): admin.firestore.Firestore {
    return this.firebaseService.firestore;
  }

  /**
   * Create a new translation document
   */
  async createTranslation(
    translation: Omit<Translation, 'id'>,
  ): Promise<string> {
    const docRef = await this.db.collection('translations').add({
      ...translation,
      translatedAt: admin.firestore.Timestamp.fromDate(
        translation.translatedAt,
      ),
      createdAt: admin.firestore.Timestamp.fromDate(translation.createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(translation.updatedAt),
    });

    this.logger.debug(
      `Created translation ${docRef.id} for ${translation.sourceType} ${translation.sourceId} (${translation.localeCode})`,
    );
    return docRef.id;
  }

  /**
   * Get a specific translation by source and locale
   */
  async getTranslation(
    transcriptionId: string,
    sourceType: 'summary' | 'analysis',
    sourceId: string,
    localeCode: string,
    userId: string,
  ): Promise<Translation | null> {
    const snapshot = await this.db
      .collection('translations')
      .where('transcriptionId', '==', transcriptionId)
      .where('sourceType', '==', sourceType)
      .where('sourceId', '==', sourceId)
      .where('localeCode', '==', localeCode)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return this.mapTranslationDoc(snapshot.docs[0]);
  }

  /**
   * Get all translations for a conversation
   */
  async getTranslationsByConversation(
    transcriptionId: string,
    userId: string,
  ): Promise<Translation[]> {
    const snapshot = await this.db
      .collection('translations')
      .where('transcriptionId', '==', transcriptionId)
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map((doc) => this.mapTranslationDoc(doc));
  }

  /**
   * Get translations for a specific locale
   */
  async getTranslationsForLocale(
    transcriptionId: string,
    localeCode: string,
    userId: string,
  ): Promise<Translation[]> {
    const snapshot = await this.db
      .collection('translations')
      .where('transcriptionId', '==', transcriptionId)
      .where('localeCode', '==', localeCode)
      .where('userId', '==', userId)
      .get();

    return snapshot.docs.map((doc) => this.mapTranslationDoc(doc));
  }

  /**
   * Get translations for a shared conversation (no userId filter)
   */
  async getTranslationsForSharedConversation(
    transcriptionId: string,
  ): Promise<Translation[]> {
    const snapshot = await this.db
      .collection('translations')
      .where('transcriptionId', '==', transcriptionId)
      .get();

    return snapshot.docs.map((doc) => this.mapTranslationDoc(doc));
  }

  /**
   * Delete all translations for a specific locale
   */
  async deleteTranslationsForLocale(
    transcriptionId: string,
    localeCode: string,
    userId: string,
  ): Promise<number> {
    const snapshot = await this.db
      .collection('translations')
      .where('transcriptionId', '==', transcriptionId)
      .where('localeCode', '==', localeCode)
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) return 0;

    const batch = this.db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    this.logger.log(
      `Deleted ${snapshot.size} translations for locale ${localeCode} from transcription ${transcriptionId}`,
    );
    return snapshot.size;
  }

  /**
   * Delete all translations for a conversation
   */
  async deleteTranslationsByConversation(
    transcriptionId: string,
    userId: string,
  ): Promise<number> {
    const snapshot = await this.db
      .collection('translations')
      .where('transcriptionId', '==', transcriptionId)
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) return 0;

    const batch = this.db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    this.logger.log(
      `Deleted ${snapshot.size} translations for transcription ${transcriptionId}`,
    );
    return snapshot.size;
  }

  /**
   * Map Firestore document to Translation type
   */
  private mapTranslationDoc(
    doc: admin.firestore.DocumentSnapshot,
  ): Translation {
    const data = doc.data()!;
    return {
      id: doc.id,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      transcriptionId: data.transcriptionId,
      userId: data.userId,
      localeCode: data.localeCode,
      localeName: data.localeName,
      content: data.content as TranslatedContent,
      translatedAt: data.translatedAt?.toDate
        ? data.translatedAt.toDate()
        : data.translatedAt,
      translatedBy: data.translatedBy,
      tokenUsage: data.tokenUsage,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt,
      updatedAt: data.updatedAt?.toDate
        ? data.updatedAt.toDate()
        : data.updatedAt,
    };
  }
}
