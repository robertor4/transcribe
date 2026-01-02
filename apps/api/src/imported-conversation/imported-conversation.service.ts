import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  ImportedConversation,
  ImportedConversationStatus,
  ImportedConversationWithContent,
  ImportConversationResponse,
  SharedTranscriptionView,
} from '@transcribe/shared';
import { ImportedConversationRepository } from '../firebase/repositories/imported-conversation.repository';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { UserRepository } from '../firebase/repositories/user.repository';

/**
 * Service for managing imported conversations.
 * Handles the import flow and validates access to shared content.
 */
@Injectable()
export class ImportedConversationService {
  private readonly logger = new Logger(ImportedConversationService.name);

  constructor(
    private readonly importedConversationRepository: ImportedConversationRepository,
    private readonly transcriptionRepository: TranscriptionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Import a shared conversation for a user.
   * Creates a linked reference to the original share.
   */
  async importConversation(
    userId: string,
    shareToken: string,
    password?: string,
  ): Promise<ImportConversationResponse> {
    // Check if user already imported this share
    const existing = await this.importedConversationRepository.getByShareToken(
      userId,
      shareToken,
    );

    if (existing) {
      // If soft-deleted, restore it
      if (existing.deletedAt) {
        await this.importedConversationRepository.restore(userId, existing.id);
        const restored = await this.importedConversationRepository.getById(
          userId,
          existing.id,
        );
        return {
          importedConversation: restored!,
          alreadyImported: true,
        };
      }

      return {
        importedConversation: existing,
        alreadyImported: true,
      };
    }

    // Validate the share exists and is accessible
    const transcription =
      await this.transcriptionRepository.getTranscriptionByShareToken(
        shareToken,
      );

    if (!transcription || !transcription.shareSettings?.enabled) {
      throw new NotFoundException('Share not found or has been revoked');
    }

    const settings = transcription.shareSettings;

    // Check if link has expired
    if (settings.expiresAt && new Date(settings.expiresAt) < new Date()) {
      throw new BadRequestException('This share link has expired');
    }

    // Check view count limit
    const currentViewCount = settings.viewCount || 0;
    if (settings.maxViews && currentViewCount >= settings.maxViews) {
      throw new BadRequestException(
        'View limit has been reached for this share',
      );
    }

    // Check password if required (passwords are bcrypt hashed)
    if (settings.password) {
      const isValidPassword = await bcrypt.compare(
        password || '',
        settings.password,
      );
      if (!isValidPassword) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    // Get sharer's info
    const sharer = await this.userRepository.getUserById(transcription.userId);
    const sharedByName = sharer?.displayName || sharer?.email || 'Someone';
    const sharedByEmail = sharer?.email;

    // Create the import
    const importedConversation =
      await this.importedConversationRepository.create({
        userId,
        shareToken,
        originalTranscriptionId: transcription.id,
        title: transcription.title || transcription.fileName,
        sharedByName,
        sharedByEmail,
        expiresAt: settings.expiresAt,
        importedAt: new Date(),
      });

    this.logger.log(
      `User ${userId} imported shared conversation ${transcription.id}`,
    );

    return {
      importedConversation,
      alreadyImported: false,
    };
  }

  /**
   * Get all imported conversations for a user.
   */
  async getImports(userId: string): Promise<ImportedConversation[]> {
    return this.importedConversationRepository.listByUser(userId);
  }

  /**
   * Get count of imported conversations for a user.
   */
  async getImportCount(userId: string): Promise<number> {
    return this.importedConversationRepository.getCountByUser(userId);
  }

  /**
   * Get an imported conversation with its live content.
   * Validates the share is still accessible and fetches fresh content.
   */
  async getImportWithContent(
    userId: string,
    importId: string,
  ): Promise<ImportedConversationWithContent> {
    const importedConversation =
      await this.importedConversationRepository.getById(userId, importId);

    if (!importedConversation) {
      throw new NotFoundException('Imported conversation not found');
    }

    // Update last accessed timestamp
    await this.importedConversationRepository.updateLastAccessed(importId);

    // Try to fetch the live shared content
    const { content, status } = await this.fetchSharedContent(
      importedConversation.shareToken,
    );

    return {
      importedConversation,
      sharedContent: content,
      status,
    };
  }

  /**
   * Remove an imported conversation (soft delete).
   */
  async removeImport(userId: string, importId: string): Promise<void> {
    await this.importedConversationRepository.softDelete(userId, importId);
    this.logger.log(`User ${userId} removed imported conversation ${importId}`);
  }

  /**
   * Check if a user has imported a specific share.
   */
  async checkImportStatus(
    userId: string,
    shareToken: string,
  ): Promise<{ imported: boolean; importedAt?: Date }> {
    const existing = await this.importedConversationRepository.getByShareToken(
      userId,
      shareToken,
    );

    if (existing && !existing.deletedAt) {
      return {
        imported: true,
        importedAt: existing.importedAt,
      };
    }

    return { imported: false };
  }

  /**
   * Fetch live shared content and determine its status.
   * Does not increment view count as this is for imported content viewing.
   */
  private async fetchSharedContent(shareToken: string): Promise<{
    content: SharedTranscriptionView | null;
    status: ImportedConversationStatus;
  }> {
    const transcription =
      await this.transcriptionRepository.getTranscriptionByShareToken(
        shareToken,
      );

    // Check if share was revoked or transcription deleted
    if (!transcription || !transcription.shareSettings?.enabled) {
      return { content: null, status: 'revoked' };
    }

    const settings = transcription.shareSettings;

    // Check if link has expired
    if (settings.expiresAt && new Date(settings.expiresAt) < new Date()) {
      return { content: null, status: 'expired' };
    }

    // Check view count limit (but don't increment for imported content)
    const currentViewCount = settings.viewCount || 0;
    if (settings.maxViews && currentViewCount >= settings.maxViews) {
      return { content: null, status: 'unavailable' };
    }

    // Get sharer's info
    const sharer = await this.userRepository.getUserById(transcription.userId);
    const sharedBy = sharer?.displayName || sharer?.email || 'Anonymous';

    // Get content options
    const contentOptions = settings.contentOptions || {
      includeTranscript: true,
      includeSummary: true,
      includeCommunicationStyles: true,
      includeActionItems: true,
      includeSpeakerInfo: true,
      includeOnDemandAnalyses: false,
      selectedAnalysisIds: [],
    };

    // Build shared view (similar to getSharedTranscription but without view increment)
    // Note: For imported content, we include all available content based on share settings
    const getSummaryContent = (): string => {
      if (transcription.summaryV2 || transcription.coreAnalyses?.summaryV2) {
        // Return empty string - we'll use summaryV2 directly
        return '';
      }
      return (
        transcription.coreAnalyses?.summary ||
        transcription.analyses?.summary ||
        ''
      );
    };

    const analysesSource = {
      summary: getSummaryContent(),
      actionItems:
        transcription.coreAnalyses?.actionItems ||
        transcription.analyses?.actionItems ||
        '',
      communicationStyles:
        transcription.coreAnalyses?.communicationStyles ||
        transcription.analyses?.communicationStyles ||
        '',
    };

    let filteredAnalyses: Record<string, string> | undefined = {};
    if (contentOptions.includeSummary && analysesSource.summary) {
      filteredAnalyses.summary = analysesSource.summary;
    }
    if (
      contentOptions.includeCommunicationStyles &&
      analysesSource.communicationStyles
    ) {
      filteredAnalyses.communicationStyles = analysesSource.communicationStyles;
    }
    if (contentOptions.includeActionItems && analysesSource.actionItems) {
      filteredAnalyses.actionItems = analysesSource.actionItems;
    }
    if (Object.keys(filteredAnalyses).length === 0) {
      filteredAnalyses = undefined;
    }

    const content: SharedTranscriptionView = {
      id: transcription.id,
      fileName: transcription.fileName,
      title: transcription.title,
      transcriptText: contentOptions.includeTranscript
        ? transcription.transcriptText
        : undefined,
      analyses: filteredAnalyses,
      summaryV2: contentOptions.includeSummary
        ? transcription.summaryV2 || transcription.coreAnalyses?.summaryV2
        : undefined,
      generatedAnalyses: [], // Don't fetch on-demand analyses for now
      speakerSegments: contentOptions.includeSpeakerInfo
        ? transcription.speakerSegments
        : undefined,
      speakers: contentOptions.includeSpeakerInfo
        ? transcription.speakers
        : undefined,
      createdAt: transcription.createdAt,
      sharedBy,
      viewCount: currentViewCount,
      contentOptions,
      translations: transcription.translations || undefined,
      preferredTranslationLanguage:
        transcription.preferredTranslationLanguage || undefined,
    };

    return { content, status: 'active' };
  }
}
