import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { TranscriptChunkPayload, ScoredChunk } from '@transcribe/shared';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'transcript_chunks';
const VECTOR_SIZE = 1536; // text-embedding-3-small dimensions

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

interface QdrantFilter {
  must?: Array<{
    key: string;
    match: { value: string | number | boolean };
  }>;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private collectionName: string;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('QDRANT_URL');
    const apiKey = this.configService.get<string>('QDRANT_API_KEY');

    if (!url) {
      this.logger.warn(
        'QDRANT_URL not configured - vector search will be disabled',
      );
    }

    this.client = new QdrantClient({
      url: url || 'http://localhost:6333',
      apiKey,
    });

    this.collectionName =
      this.configService.get<string>('QDRANT_COLLECTION') || COLLECTION_NAME;
  }

  async onModuleInit(): Promise<void> {
    await this.ensureCollectionExists();
  }

  /**
   * Check if Qdrant is configured and available
   */
  isConfigured(): boolean {
    return !!this.configService.get<string>('QDRANT_URL');
  }

  /**
   * Ensure the collection exists, create if not
   */
  private async ensureCollectionExists(): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn('Qdrant not configured, skipping collection check');
      return;
    }

    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        this.logger.log(`Creating collection: ${this.collectionName}`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: VECTOR_SIZE,
            distance: 'Cosine',
          },
          on_disk_payload: true, // Store payloads on disk (better for free tier)
          optimizers_config: {
            indexing_threshold: 10000, // Start indexing after 10K points
          },
        });

        // Create payload indexes for efficient filtering
        await this.createPayloadIndexes();
        this.logger.log(
          `Collection ${this.collectionName} created successfully`,
        );
      } else {
        this.logger.log(`Collection ${this.collectionName} already exists`);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure collection exists: ${error.message}`);
      // Don't throw - allow app to start even if Qdrant is unavailable
    }
  }

  /**
   * Create indexes on payload fields for efficient filtering
   */
  private async createPayloadIndexes(): Promise<void> {
    const indexFields = ['userId', 'transcriptionId', 'folderId'];

    for (const field of indexFields) {
      try {
        await this.client.createPayloadIndex(this.collectionName, {
          field_name: field,
          field_schema: 'keyword',
        });
        this.logger.debug(`Created index on ${field}`);
      } catch (error) {
        // Index might already exist
        this.logger.debug(
          `Index on ${field} may already exist: ${error.message}`,
        );
      }
    }
  }

  /**
   * Upsert points (chunks with embeddings) to the collection
   */
  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('Qdrant not configured');
    }

    if (points.length === 0) {
      return;
    }

    // Batch upsert in chunks of 100
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await this.client.upsert(this.collectionName, {
        points: batch,
        wait: true,
      });
      this.logger.debug(
        `Upserted batch ${i / batchSize + 1} (${batch.length} points)`,
      );
    }

    this.logger.log(
      `Upserted ${points.length} points to ${this.collectionName}`,
    );
  }

  /**
   * Search for similar vectors
   */
  async search(
    vector: number[],
    filter: { userId: string; transcriptionId?: string; folderId?: string },
    limit: number = 10,
    scoreThreshold: number = 0.3,
  ): Promise<ScoredChunk[]> {
    if (!this.isConfigured()) {
      throw new Error('Qdrant not configured');
    }

    const qdrantFilter: QdrantFilter = {
      must: [{ key: 'userId', match: { value: filter.userId } }],
    };

    if (filter.transcriptionId) {
      qdrantFilter.must!.push({
        key: 'transcriptionId',
        match: { value: filter.transcriptionId },
      });
    }

    if (filter.folderId) {
      qdrantFilter.must!.push({
        key: 'folderId',
        match: { value: filter.folderId },
      });
    }

    const results = await this.client.search(this.collectionName, {
      vector,
      filter: qdrantFilter,
      limit,
      with_payload: true,
      score_threshold: scoreThreshold,
    });

    return results.map((result) => ({
      id: String(result.id),
      score: result.score,
      payload: result.payload as unknown as TranscriptChunkPayload,
    }));
  }

  /**
   * Delete all points for a transcription (for re-indexing)
   */
  async deleteByTranscriptionId(transcriptionId: string): Promise<number> {
    if (!this.isConfigured()) {
      throw new Error('Qdrant not configured');
    }

    const result = await this.client.delete(this.collectionName, {
      filter: {
        must: [{ key: 'transcriptionId', match: { value: transcriptionId } }],
      },
      wait: true,
    });

    this.logger.log(`Deleted points for transcription ${transcriptionId}`);
    return typeof result === 'object' && 'deleted_count' in result
      ? (result as { deleted_count: number }).deleted_count
      : 0;
  }

  /**
   * Delete all points for a user (for account deletion)
   */
  async deleteByUserId(userId: string): Promise<number> {
    if (!this.isConfigured()) {
      throw new Error('Qdrant not configured');
    }

    const result = await this.client.delete(this.collectionName, {
      filter: {
        must: [{ key: 'userId', match: { value: userId } }],
      },
      wait: true,
    });

    this.logger.log(`Deleted all points for user ${userId}`);
    return typeof result === 'object' && 'deleted_count' in result
      ? (result as { deleted_count: number }).deleted_count
      : 0;
  }

  /**
   * Count points for a transcription (to check if indexed)
   */
  async countByTranscriptionId(transcriptionId: string): Promise<number> {
    if (!this.isConfigured()) {
      return 0;
    }

    try {
      const result = await this.client.count(this.collectionName, {
        filter: {
          must: [{ key: 'transcriptionId', match: { value: transcriptionId } }],
        },
        exact: true,
      });

      return result.count;
    } catch (error) {
      this.logger.error(`Failed to count points: ${error.message}`);
      return 0;
    }
  }

  /**
   * Generate a unique point ID
   */
  generatePointId(): string {
    return uuidv4();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.client.getCollections();
      return true;
    } catch {
      return false;
    }
  }
}
