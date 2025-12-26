import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  Citation,
  AskResponse,
  FindResponse,
  ConversationMatch,
  MatchedSnippet,
  ScoredChunk,
  QAHistoryItem,
} from '@transcribe/shared';
import { QdrantService } from './qdrant.service';
import { EmbeddingService } from './embedding.service';
import { ChunkingService } from './chunking.service';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { FolderRepository } from '../firebase/repositories/folder.repository';

const QA_SYNTHESIS_PROMPT = `You are answering a question about a recorded conversation. Answer based on the provided transcript excerpts.

TRANSCRIPT EXCERPTS (format: [timestamp, speaker]: "quote"):
{chunks}
{history}
USER QUESTION: {question}

INSTRUCTIONS:
1. Answer the question using the transcript excerpts above
2. Include citations in this format: [MM:SS, Speaker Name] after relevant statements
3. If the context only partially answers the question, provide what information IS available
4. Be helpful - if the topic is mentioned, summarize what was said about it
5. Only say you couldn't find information if the topic is truly not mentioned at all
6. If this is a follow-up question, use the conversation history to understand context

ANSWER:`;

// Max history items: first exchange (topic anchor) + last 5 exchanges (recent context)
const MAX_HISTORY_ITEMS = 6;

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private qdrantService: QdrantService,
    private embeddingService: EmbeddingService,
    private chunkingService: ChunkingService,
    private transcriptionRepository: TranscriptionRepository,
    private folderRepository: FolderRepository,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Check if vector search is available
   */
  isAvailable(): boolean {
    return this.qdrantService.isConfigured();
  }

  /**
   * Index a transcription for Q&A (on-demand)
   * Returns the number of chunks indexed
   */
  async indexTranscription(
    userId: string,
    transcriptionId: string,
  ): Promise<number> {
    const startTime = Date.now();

    // Fetch transcription
    const transcription = await this.transcriptionRepository.getTranscription(
      userId,
      transcriptionId,
    );

    if (!transcription) {
      throw new NotFoundException('Transcription not found');
    }

    if (
      !transcription.speakerSegments ||
      transcription.speakerSegments.length === 0
    ) {
      this.logger.warn(
        `Transcription ${transcriptionId} has no speaker segments`,
      );
      return 0;
    }

    // Delete existing chunks (for re-indexing)
    await this.qdrantService.deleteByTranscriptionId(transcriptionId);

    // Chunk the segments
    const chunks = this.chunkingService.chunkSegments(
      transcription.speakerSegments,
    );

    if (chunks.length === 0) {
      this.logger.warn(
        `No chunks generated for transcription ${transcriptionId}`,
      );
      return 0;
    }

    // Generate embeddings
    const texts = chunks.map((c) => c.text);
    const embeddings = await this.embeddingService.embedBatch(texts);

    // Prepare Qdrant points
    const points = chunks.map((chunk, index) => ({
      id: this.qdrantService.generatePointId(),
      vector: embeddings[index],
      payload: {
        userId,
        transcriptionId,
        folderId: transcription.folderId || null,
        segmentIndex: chunk.segmentIndex,
        speaker: chunk.speaker,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        text: chunk.text,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunk.totalChunks,
        conversationTitle: transcription.title || transcription.fileName,
        conversationDate: transcription.createdAt.toISOString(),
        indexedAt: new Date().toISOString(),
      } as Record<string, unknown>,
    }));

    // Upsert to Qdrant
    await this.qdrantService.upsertPoints(points);

    // Update Firestore with indexing metadata
    await this.transcriptionRepository.updateTranscription(transcriptionId, {
      vectorIndexedAt: new Date(),
      vectorChunkCount: chunks.length,
      vectorIndexVersion: 1,
    });

    const duration = Date.now() - startTime;
    this.logger.log(
      `Indexed transcription ${transcriptionId}: ${chunks.length} chunks in ${duration}ms`,
    );

    return chunks.length;
  }

  /**
   * Check if a transcription is indexed
   */
  async isIndexed(transcriptionId: string): Promise<boolean> {
    const count =
      await this.qdrantService.countByTranscriptionId(transcriptionId);
    return count > 0;
  }

  /**
   * Ensure a transcription is indexed (index on-demand if not)
   */
  async ensureIndexed(userId: string, transcriptionId: string): Promise<void> {
    const isIndexed = await this.isIndexed(transcriptionId);
    if (!isIndexed) {
      await this.indexTranscription(userId, transcriptionId);
    }
  }

  /**
   * Ask a question about a single conversation
   */
  async askConversation(
    userId: string,
    transcriptionId: string,
    question: string,
    maxResults: number = 10,
    history?: QAHistoryItem[],
  ): Promise<AskResponse> {
    const startTime = Date.now();

    // Ensure indexed (on-demand indexing)
    await this.ensureIndexed(userId, transcriptionId);

    // Embed question for vector search
    const queryVector = await this.embeddingService.embed(question);

    // Search with lower threshold first to debug
    const results = await this.qdrantService.search(
      queryVector,
      { userId, transcriptionId },
      maxResults,
    );

    if (results.length === 0) {
      return {
        answer:
          "I couldn't find relevant information about that in this conversation.",
        citations: [],
        searchScope: 'conversation',
        processingTimeMs: Date.now() - startTime,
        indexed: true,
      };
    }

    // Generate answer with GPT (including conversation history for context)
    const { answer, citations } = await this.synthesizeAnswer(
      question,
      results,
      history,
    );

    return {
      answer,
      citations,
      searchScope: 'conversation',
      processingTimeMs: Date.now() - startTime,
      indexed: true,
    };
  }

  /**
   * Ask a question across a folder's conversations
   */
  async askFolder(
    userId: string,
    folderId: string,
    question: string,
    maxResults: number = 15,
    history?: QAHistoryItem[],
  ): Promise<AskResponse> {
    const startTime = Date.now();

    // Verify folder exists and belongs to user
    const folder = await this.folderRepository.getFolder(userId, folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Get all transcriptions in folder and ensure they're indexed
    const transcriptions =
      await this.transcriptionRepository.getTranscriptionsByFolder(
        userId,
        folderId,
      );

    // Index any unindexed transcriptions
    for (const t of transcriptions) {
      if (!t.vectorIndexedAt) {
        await this.indexTranscription(userId, t.id);
      }
    }

    // Embed question for vector search
    const queryVector = await this.embeddingService.embed(question);

    // Search across folder
    const results = await this.qdrantService.search(
      queryVector,
      { userId, folderId },
      maxResults,
    );

    if (results.length === 0) {
      return {
        answer:
          "I couldn't find relevant information about that in this folder's conversations.",
        citations: [],
        searchScope: 'folder',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Generate answer with conversation history for context
    const { answer, citations } = await this.synthesizeAnswer(
      question,
      results,
      history,
    );

    return {
      answer,
      citations,
      searchScope: 'folder',
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Ask a question across all user's conversations
   */
  async askGlobal(
    userId: string,
    question: string,
    maxResults: number = 20,
  ): Promise<AskResponse> {
    const startTime = Date.now();

    // Embed question
    const queryVector = await this.embeddingService.embed(question);

    // Search across all user's conversations
    const results = await this.qdrantService.search(
      queryVector,
      { userId },
      maxResults,
    );

    if (results.length === 0) {
      return {
        answer:
          "I couldn't find relevant information about that in your conversations.",
        citations: [],
        searchScope: 'global',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Generate answer
    const { answer, citations } = await this.synthesizeAnswer(
      question,
      results,
    );

    return {
      answer,
      citations,
      searchScope: 'global',
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Find conversations matching a query (card view)
   */
  async findConversations(
    userId: string,
    query: string,
    folderId?: string,
    maxResults: number = 10,
  ): Promise<FindResponse> {
    const startTime = Date.now();

    // Embed query
    const queryVector = await this.embeddingService.embed(query);

    // Search
    const filter: { userId: string; folderId?: string } = { userId };
    if (folderId) {
      filter.folderId = folderId;
    }

    const results = await this.qdrantService.search(
      queryVector,
      filter,
      maxResults * 3, // Get more results to group by conversation
    );

    // Group results by transcription
    const conversationMap = new Map<string, ScoredChunk[]>();
    for (const result of results) {
      const tid = result.payload.transcriptionId;
      if (!conversationMap.has(tid)) {
        conversationMap.set(tid, []);
      }
      conversationMap.get(tid)!.push(result);
    }

    // Get folder names if needed
    const folderIds = new Set<string>();
    for (const result of results) {
      if (result.payload.folderId) {
        folderIds.add(result.payload.folderId);
      }
    }

    const folderNames = new Map<string, string>();
    for (const fid of folderIds) {
      try {
        const folder = await this.folderRepository.getFolder(userId, fid);
        if (folder) {
          folderNames.set(fid, folder.name);
        }
      } catch {
        // Folder might not exist anymore
      }
    }

    // Build conversation matches
    const conversations: ConversationMatch[] = [];
    for (const [transcriptionId, chunks] of conversationMap) {
      const firstChunk = chunks[0].payload;

      const matchedSnippets: MatchedSnippet[] = chunks
        .slice(0, 3)
        .map((chunk) => ({
          text: this.truncateText(chunk.payload.text, 150),
          speaker: chunk.payload.speaker,
          timestamp: this.chunkingService.formatTimestamp(
            chunk.payload.startTime,
          ),
          timestampSeconds: chunk.payload.startTime,
          relevanceScore: chunk.score,
        }));

      conversations.push({
        transcriptionId,
        title: firstChunk.conversationTitle,
        createdAt: new Date(firstChunk.conversationDate),
        folderId: firstChunk.folderId,
        folderName: firstChunk.folderId
          ? folderNames.get(firstChunk.folderId) || null
          : null,
        matchedSnippets,
        totalMatches: chunks.length,
      });
    }

    // Sort by highest relevance score
    conversations.sort((a, b) => {
      const aScore = Math.max(
        ...a.matchedSnippets.map((s) => s.relevanceScore),
      );
      const bScore = Math.max(
        ...b.matchedSnippets.map((s) => s.relevanceScore),
      );
      return bScore - aScore;
    });

    return {
      conversations: conversations.slice(0, maxResults),
      totalConversations: conversations.length,
      searchScope: folderId ? 'folder' : 'global',
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Format conversation history for inclusion in GPT prompt
   * Frontend sends: first exchange (topic anchor) + last 5 exchanges (recent context)
   * We truncate answers to control token usage while preserving full questions
   */
  private formatHistoryForPrompt(history?: QAHistoryItem[]): string {
    if (!history || history.length === 0) {
      return '';
    }

    // Frontend already selects relevant history (first + last 5)
    // Just apply token control via truncation
    const historyText = history
      .slice(0, MAX_HISTORY_ITEMS) // Safety limit
      .map((item, idx) => {
        // Truncate answers to control token usage (keep questions full, they're short)
        const truncatedAnswer = this.truncateText(item.answer, 500);
        return `Q${idx + 1}: ${item.question}\nA${idx + 1}: ${truncatedAnswer}`;
      })
      .join('\n\n');

    return `\nPREVIOUS Q&A IN THIS SESSION:\n${historyText}\n`;
  }

  /**
   * Synthesize an answer using GPT from search results
   */
  private async synthesizeAnswer(
    question: string,
    results: ScoredChunk[],
    history?: QAHistoryItem[],
  ): Promise<{ answer: string; citations: Citation[] }> {
    // Format context chunks with citations
    const contextParts = results.map((result) => {
      const timestamp = this.chunkingService.formatTimestamp(
        result.payload.startTime,
      );
      return `[${timestamp}, ${result.payload.speaker}]: "${result.payload.text}"`;
    });

    const context = contextParts.join('\n\n');

    // Format conversation history (if any)
    const historySection = this.formatHistoryForPrompt(history);

    const prompt = QA_SYNTHESIS_PROMPT.replace('{chunks}', context)
      .replace('{history}', historySection)
      .replace('{question}', question);

    // Generate answer with gpt-4o-mini for fast Q&A responses
    // This is a summarization task, not complex reasoning - 4o-mini is ideal
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that summarizes and answers questions about recorded conversations. Extract and present relevant information from the provided transcript excerpts. Always try to be helpful - if something is mentioned, explain what was said about it.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const answer =
      response.choices[0]?.message?.content || 'Unable to generate answer.';

    // Extract citations from the results used
    const citations: Citation[] = results.map((result) => ({
      transcriptionId: result.payload.transcriptionId,
      conversationTitle: result.payload.conversationTitle,
      speaker: result.payload.speaker,
      timestamp: this.chunkingService.formatTimestamp(result.payload.startTime),
      timestampSeconds: result.payload.startTime,
      text: this.truncateText(result.payload.text, 200),
      relevanceScore: result.score,
    }));

    return { answer, citations };
  }

  /**
   * Truncate text with ellipsis
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - 3) + '...';
  }

  /**
   * Delete all vectors for a transcription (when transcription is deleted)
   */
  async deleteTranscriptionVectors(transcriptionId: string): Promise<void> {
    await this.qdrantService.deleteByTranscriptionId(transcriptionId);
  }

  /**
   * Re-index a transcription (after corrections)
   */
  async reindexTranscription(
    userId: string,
    transcriptionId: string,
  ): Promise<number> {
    return this.indexTranscription(userId, transcriptionId);
  }

  /**
   * Get indexing status for a transcription
   */
  async getIndexingStatus(
    userId: string,
    transcriptionId: string,
  ): Promise<{ indexed: boolean; chunkCount: number; indexedAt?: Date }> {
    const transcription = await this.transcriptionRepository.getTranscription(
      userId,
      transcriptionId,
    );

    if (!transcription) {
      throw new NotFoundException('Transcription not found');
    }

    const chunkCount =
      await this.qdrantService.countByTranscriptionId(transcriptionId);

    return {
      indexed: chunkCount > 0,
      chunkCount,
      indexedAt: transcription.vectorIndexedAt,
    };
  }
}
