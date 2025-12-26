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
  SummaryV2,
  QADebugInfo,
} from '@transcribe/shared';
import { QdrantService } from './qdrant.service';
import { EmbeddingService } from './embedding.service';
import { ChunkingService } from './chunking.service';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { FolderRepository } from '../firebase/repositories/folder.repository';

const QA_SYNTHESIS_PROMPT = `Answer questions about a recorded conversation.

CONVERSATION SUMMARY:
{summary}
{chunks}
{history}
USER QUESTION: {question}

VOICE & STYLE:
- Be concise. Short sentences, active voice.
- Direct and confident. No hedging or apologizing.
- Professional but human. Not academic or chatty.
- Never use emojis, exclamation marks, or AI self-reference ("I think", "I believe").

INSTRUCTIONS:
1. Use the summary for general questions. Use transcript excerpts for specific details.
2. Include citations [MM:SS, Speaker Name] when referencing transcript excerpts.
3. Answer what was asked. Skip preamble like "Based on the conversation..." or "The speaker discusses...".
4. If information is partial, state what's available without over-explaining gaps.
5. For follow-ups, use conversation history for context.

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

    // Build metadata text for title/summary chunk
    const title = transcription.title || transcription.fileName || 'Untitled';
    const metadataParts = [title];

    // Add summary intro and key point topics if available
    if (transcription.summaryV2?.intro) {
      metadataParts.push(transcription.summaryV2.intro);
    }
    if (transcription.summaryV2?.keyPoints?.length) {
      const topics = transcription.summaryV2.keyPoints.map((kp) => kp.topic);
      metadataParts.push(`Topics: ${topics.join(', ')}`);
    }

    const metadataText = metadataParts.join('. ');

    // Generate embeddings for content chunks + metadata chunk
    const texts = [...chunks.map((c) => c.text), metadataText];
    const embeddings = await this.embeddingService.embedBatch(texts);

    const conversationTitle = title;
    const conversationDate = transcription.createdAt.toISOString();
    const indexedAt = new Date().toISOString();

    // Prepare content chunk points
    const contentPoints = chunks.map((chunk, index) => ({
      id: this.qdrantService.generatePointId(),
      vector: embeddings[index],
      payload: {
        userId,
        transcriptionId,
        folderId: transcription.folderId || null,
        chunkType: 'content',
        segmentIndex: chunk.segmentIndex,
        speaker: chunk.speaker,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        text: chunk.text,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunk.totalChunks,
        conversationTitle,
        conversationDate,
        indexedAt,
      } as Record<string, unknown>,
    }));

    // Prepare metadata chunk point (title + summary)
    const metadataPoint = {
      id: this.qdrantService.generatePointId(),
      vector: embeddings[embeddings.length - 1], // Last embedding is for metadata
      payload: {
        userId,
        transcriptionId,
        folderId: transcription.folderId || null,
        chunkType: 'metadata',
        segmentIndex: -1, // Special marker for metadata chunk
        speaker: '',
        startTime: 0,
        endTime: 0,
        text: metadataText,
        chunkIndex: 0,
        totalChunks: 1,
        conversationTitle,
        conversationDate,
        indexedAt,
      } as Record<string, unknown>,
    };

    // Upsert all points (content + metadata)
    const allPoints = [...contentPoints, metadataPoint];
    await this.qdrantService.upsertPoints(allPoints);

    // Update Firestore with indexing metadata (content chunks + 1 metadata chunk)
    const totalChunks = allPoints.length;
    await this.transcriptionRepository.updateTranscription(transcriptionId, {
      vectorIndexedAt: new Date(),
      vectorChunkCount: totalChunks,
      vectorIndexVersion: 2, // Bumped for metadata chunk support
    });

    const duration = Date.now() - startTime;
    this.logger.log(
      `Indexed transcription ${transcriptionId}: ${totalChunks} chunks (${chunks.length} content + 1 metadata) in ${duration}ms`,
    );

    return totalChunks;
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

    // Fetch transcription to get summary (always needed for context)
    const transcription = await this.transcriptionRepository.getTranscription(
      userId,
      transcriptionId,
    );

    if (!transcription) {
      throw new NotFoundException('Transcription not found');
    }

    // Ensure indexed (on-demand indexing)
    await this.ensureIndexed(userId, transcriptionId);

    // Embed question for vector search
    const queryVector = await this.embeddingService.embed(question);

    // Search for relevant snippets (may return empty for generic questions)
    const results = await this.qdrantService.search(
      queryVector,
      { userId, transcriptionId },
      maxResults,
    );

    this.logger.debug(
      `Q&A search for "${question.slice(0, 50)}..." returned ${results.length} chunks` +
        (results.length > 0
          ? ` (top score: ${results[0].score.toFixed(3)})`
          : ''),
    );

    // Always synthesize answer with summary + any relevant snippets
    // Use summaryV2 (structured) if available, fallback to legacy summary string
    const summaryText = this.formatSummaryForContext(
      transcription.summaryV2,
      transcription.summary,
    );
    const { answer, citations, debug } = await this.synthesizeAnswer(
      question,
      results,
      history,
      summaryText,
    );

    return {
      answer,
      citations,
      searchScope: 'conversation',
      processingTimeMs: Date.now() - startTime,
      indexed: true,
      debug,
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

      // Separate content chunks from metadata chunks for snippets
      const contentChunks = chunks.filter(
        (c) => (c.payload as { chunkType?: string }).chunkType !== 'metadata',
      );

      const matchedSnippets: MatchedSnippet[] = contentChunks
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

      // Get highest score from all chunks (including metadata) for sorting
      const maxScore = Math.max(...chunks.map((c) => c.score));

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
        // Store max score for sorting (not exposed in interface, used internally)
        _maxScore: maxScore,
      } as ConversationMatch & { _maxScore: number });
    }

    // Sort by highest relevance score (using stored max score)
    conversations.sort((a, b) => {
      const aScore =
        (a as ConversationMatch & { _maxScore?: number })._maxScore ?? 0;
      const bScore =
        (b as ConversationMatch & { _maxScore?: number })._maxScore ?? 0;
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
   * Approximate token count (rough estimate: ~4 chars per token for English)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Synthesize an answer using GPT from summary + search results
   */
  private async synthesizeAnswer(
    question: string,
    results: ScoredChunk[],
    history?: QAHistoryItem[],
    summary?: string,
  ): Promise<{ answer: string; citations: Citation[]; debug: QADebugInfo }> {
    const model = 'gpt-4o-mini';
    const systemContent =
      'You answer questions about recorded conversations. Be concise and direct. Use short sentences and active voice. Never use filler phrases, hedging language, or AI self-reference.';

    // Format context chunks with citations (if any relevant snippets found)
    const contextParts = results.map((result) => {
      const timestamp = this.chunkingService.formatTimestamp(
        result.payload.startTime,
      );
      return `[${timestamp}, ${result.payload.speaker}]: "${result.payload.text}"`;
    });

    const chunksSection =
      results.length > 0
        ? `\nRELEVANT TRANSCRIPT EXCERPTS (format: [timestamp, speaker]: "quote"):\n${contextParts.join('\n\n')}`
        : '';

    // Format conversation history (if any)
    const historySection = this.formatHistoryForPrompt(history);
    const summaryText = summary || 'No summary available.';

    const prompt = QA_SYNTHESIS_PROMPT.replace('{summary}', summaryText)
      .replace('{chunks}', chunksSection)
      .replace('{history}', historySection)
      .replace('{question}', question);

    // Calculate token estimates for debug info
    const summaryTokens = this.estimateTokens(summaryText);
    const chunksTokens = this.estimateTokens(chunksSection);
    const historyTokens = this.estimateTokens(historySection);
    const questionTokens = this.estimateTokens(question);
    const systemPromptTokens = this.estimateTokens(systemContent);
    const totalInputTokens = systemPromptTokens + this.estimateTokens(prompt);

    // Generate answer with gpt-4o-mini for fast Q&A responses
    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const answer =
      response.choices[0]?.message?.content || 'Unable to generate answer.';
    const outputTokens = this.estimateTokens(answer);

    // GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output
    const inputCost = (totalInputTokens / 1_000_000) * 0.15;
    const outputCost = (outputTokens / 1_000_000) * 0.6;
    const estimatedCostUsd = inputCost + outputCost;

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

    const debug: QADebugInfo = {
      summaryTokens,
      chunksTokens,
      historyTokens,
      questionTokens,
      systemPromptTokens,
      totalInputTokens,
      outputTokens,
      historyCount: history?.length || 0,
      chunksCount: results.length,
      estimatedCostUsd,
      model,
    };

    return { answer, citations, debug };
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
   * Format summary for GPT context - uses V2 structured format if available, falls back to legacy string
   */
  private formatSummaryForContext(
    summaryV2?: SummaryV2,
    legacySummary?: string,
  ): string {
    // Prefer V2 structured summary
    if (summaryV2) {
      const parts: string[] = [];

      if (summaryV2.title) {
        parts.push(`Title: ${summaryV2.title}`);
      }

      if (summaryV2.intro) {
        parts.push(`Overview: ${summaryV2.intro}`);
      }

      if (summaryV2.keyPoints && summaryV2.keyPoints.length > 0) {
        const keyPointsText = summaryV2.keyPoints
          .map((kp) => `- ${kp.topic}: ${kp.description}`)
          .join('\n');
        parts.push(`Key Points:\n${keyPointsText}`);
      }

      if (summaryV2.detailedSections && summaryV2.detailedSections.length > 0) {
        const sectionsText = summaryV2.detailedSections
          .map((s) => `${s.topic}:\n${s.content}`)
          .join('\n\n');
        parts.push(`Details:\n${sectionsText}`);
      }

      if (summaryV2.decisions && summaryV2.decisions.length > 0) {
        parts.push(`Decisions: ${summaryV2.decisions.join(', ')}`);
      }

      if (summaryV2.nextSteps && summaryV2.nextSteps.length > 0) {
        parts.push(`Next Steps: ${summaryV2.nextSteps.join(', ')}`);
      }

      return parts.join('\n\n');
    }

    // Fallback to legacy markdown summary
    if (legacySummary) {
      return legacySummary;
    }

    return 'No summary available.';
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
