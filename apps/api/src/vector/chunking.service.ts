import { Injectable, Logger } from '@nestjs/common';
import { SpeakerSegment, TranscriptChunk } from '@transcribe/shared';

interface ChunkConfig {
  maxTokens: number;
  overlapTokens: number;
  minChunkSize: number;
}

const DEFAULT_CONFIG: ChunkConfig = {
  maxTokens: 500,
  overlapTokens: 50,
  minChunkSize: 20,
};

// Rough estimate: ~4 characters per token for English
const CHARS_PER_TOKEN = 4;

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  /**
   * Process speaker segments into chunks for embedding
   * Uses speaker segments as natural boundaries, splits long segments if needed
   */
  chunkSegments(
    segments: SpeakerSegment[],
    config: ChunkConfig = DEFAULT_CONFIG,
  ): TranscriptChunk[] {
    const chunks: TranscriptChunk[] = [];

    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
      const segment = segments[segmentIndex];
      const tokenCount = this.estimateTokens(segment.text);

      if (tokenCount <= config.maxTokens) {
        // Segment fits in one chunk
        chunks.push({
          segmentIndex,
          chunkIndex: 0,
          totalChunks: 1,
          speaker: segment.speakerTag,
          startTime: segment.startTime,
          endTime: segment.endTime,
          text: segment.text,
        });
      } else {
        // Split long segment with overlap
        const segmentChunks = this.splitWithOverlap(
          segment.text,
          config.maxTokens,
          config.overlapTokens,
        );

        const duration = segment.endTime - segment.startTime;
        const totalChunks = segmentChunks.length;

        segmentChunks.forEach((chunkText, chunkIdx) => {
          // Calculate approximate timestamps for chunk
          const chunkStartRatio = chunkIdx / totalChunks;
          const chunkEndRatio = (chunkIdx + 1) / totalChunks;

          chunks.push({
            segmentIndex,
            chunkIndex: chunkIdx,
            totalChunks,
            speaker: segment.speakerTag,
            startTime: segment.startTime + duration * chunkStartRatio,
            endTime: segment.startTime + duration * chunkEndRatio,
            text: chunkText,
          });
        });
      }
    }

    this.logger.log(
      `Chunked ${segments.length} segments into ${chunks.length} chunks`,
    );
    return chunks;
  }

  /**
   * Split text into chunks with overlap, respecting sentence boundaries
   */
  private splitWithOverlap(
    text: string,
    maxTokens: number,
    overlapTokens: number,
  ): string[] {
    const maxChars = maxTokens * CHARS_PER_TOKEN;
    const overlapChars = overlapTokens * CHARS_PER_TOKEN;

    // Try to split at sentence boundaries
    const sentences = this.splitIntoSentences(text);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

      if (testChunk.length > maxChars && currentChunk) {
        // Current chunk is full, save it
        chunks.push(currentChunk.trim());

        // Start new chunk with overlap from previous
        const lastWords = this.getLastNChars(currentChunk, overlapChars);
        currentChunk = lastWords + ' ' + sentence;
      } else {
        currentChunk = testChunk;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    // If sentence splitting didn't work (single long sentence), fall back to word splitting
    if (chunks.length === 0 || chunks.some((c) => c.length > maxChars * 1.5)) {
      return this.splitByWords(text, maxChars, overlapChars);
    }

    return chunks;
  }

  /**
   * Fallback: split by words when sentence splitting fails
   */
  private splitByWords(
    text: string,
    maxChars: number,
    overlapChars: number,
  ): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const word of words) {
      if (
        currentLength + word.length + 1 > maxChars &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk.join(' '));

        // Get overlap words
        const overlapWords: string[] = [];
        let overlapLength = 0;
        for (
          let i = currentChunk.length - 1;
          i >= 0 && overlapLength < overlapChars;
          i--
        ) {
          overlapWords.unshift(currentChunk[i]);
          overlapLength += currentChunk[i].length + 1;
        }

        currentChunk = [...overlapWords, word];
        currentLength = overlapLength + word.length;
      } else {
        currentChunk.push(word);
        currentLength += word.length + 1;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence-ending punctuation followed by space or end
    // Handles: . ! ? and common abbreviations
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences.filter((s) => s.trim().length > 0);
  }

  /**
   * Get the last N characters, trying to break at word boundary
   */
  private getLastNChars(text: string, n: number): string {
    if (text.length <= n) {
      return text;
    }

    const lastPart = text.slice(-n);
    const firstSpaceIndex = lastPart.indexOf(' ');

    if (firstSpaceIndex > 0 && firstSpaceIndex < n / 2) {
      // Break at word boundary if it's not too far in
      return lastPart.slice(firstSpaceIndex + 1);
    }

    return lastPart;
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
  }

  /**
   * Format timestamp as MM:SS or HH:MM:SS
   */
  formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
