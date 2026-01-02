import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const MAX_BATCH_SIZE = 100;

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    const startTime = Date.now();

    const response = await this.openai.embeddings.create({
      input: text,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const duration = Date.now() - startTime;
    this.logger.debug(`Generated embedding in ${duration}ms`);

    return response.data[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * Returns embeddings in the same order as input texts
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const startTime = Date.now();
    const allEmbeddings: number[][] = [];

    // Process in batches of MAX_BATCH_SIZE
    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      const batch = texts.slice(i, i + MAX_BATCH_SIZE);

      const response = await this.openai.embeddings.create({
        input: batch,
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      // OpenAI returns embeddings in order, but we sort by index to be safe
      const sortedData = response.data.sort((a, b) => a.index - b.index);
      const batchEmbeddings = sortedData.map((d) => d.embedding);
      allEmbeddings.push(...batchEmbeddings);

      this.logger.debug(
        `Embedded batch ${Math.floor(i / MAX_BATCH_SIZE) + 1} (${batch.length} texts)`,
      );
    }

    const duration = Date.now() - startTime;
    const tokensUsed = this.estimateTokens(texts);
    this.logger.log(
      `Generated ${texts.length} embeddings in ${duration}ms (~${tokensUsed} tokens)`,
    );

    return allEmbeddings;
  }

  /**
   * Estimate token count for texts (rough estimate)
   * OpenAI uses ~4 characters per token for English
   */
  private estimateTokens(texts: string[]): number {
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
    return Math.ceil(totalChars / 4);
  }

  /**
   * Get embedding model info
   */
  getModelInfo(): { model: string; dimensions: number } {
    return {
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }
}
