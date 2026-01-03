import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { TranscriptionService } from './transcription.service';
import { AnalysisTemplateService } from './analysis-template.service';
import { OnDemandAnalysisService } from './on-demand-analysis.service';
import { UsageService } from '../usage/usage.service';
import { VectorService } from '../vector/vector.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AskQuestionDto } from '../vector/dto/ask-question.dto';
import { PaginationDto } from './dto/pagination.dto';
import { SearchTranscriptionsDto } from './dto/search.dto';
import { AddCommentDto, UpdateCommentDto } from './dto/add-comment.dto';
import {
  CreateShareLinkDto,
  UpdateShareSettingsDto,
  SendShareEmailDto,
} from './dto/share-link.dto';
import {
  isValidAudioFile,
  validateFileSize,
  ApiResponse,
  PaginatedResponse,
  Transcription,
  SummaryComment,
  AnalysisType,
  SharedTranscriptionView,
  BatchUploadResponse,
  MAX_FILE_SIZE,
  AnalysisTemplate,
  GeneratedAnalysis,
  BlogHeroImage,
  AskResponse,
} from '@transcribe/shared';

@Controller('transcriptions')
export class TranscriptionController {
  private readonly logger = new Logger(TranscriptionController.name);

  constructor(
    private readonly transcriptionService: TranscriptionService,
    private readonly templateService: AnalysisTemplateService,
    private readonly onDemandAnalysisService: OnDemandAnalysisService,
    private readonly usageService: UsageService,
    private readonly vectorService: VectorService,
  ) {}

  // Public endpoint for shared transcripts (no auth required)
  @Get('shared/:shareToken')
  @Throttle({ short: { limit: 30, ttl: 60000 } }) // 30 views per minute (public)
  async getSharedTranscription(
    @Param('shareToken') shareToken: string,
    @Query('password') password?: string,
    @Query('incrementView') incrementView?: string,
  ): Promise<ApiResponse<SharedTranscriptionView>> {
    // Only increment view count if explicitly requested (first load)
    const shouldIncrementView = incrementView === 'true';

    const transcription =
      await this.transcriptionService.getSharedTranscription(
        shareToken,
        password,
        shouldIncrementView,
      );

    if (!transcription) {
      throw new UnauthorizedException('Invalid or expired share link');
    }

    return {
      success: true,
      data: transcription,
    };
  }

  @Post('upload')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 uploads per minute
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE, // 5GB - AssemblyAI's limit for remote URLs
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('analysisType') analysisType: AnalysisType,
    @Body('context') context: string,
    @Body('contextId') contextId: string,
    @Body('selectedTemplates') selectedTemplatesJson: string, // V2: JSON string of template IDs
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<Transcription>> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    console.log('Received file:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    if (!isValidAudioFile(file.originalname, file.mimetype)) {
      console.log(
        'Validation failed for file:',
        file.originalname,
        'with mimetype:',
        file.mimetype,
      );
      throw new BadRequestException(
        `Invalid audio file format (${file.mimetype})`,
      );
    }

    if (!validateFileSize(file.size)) {
      throw new BadRequestException('File size exceeds limit');
    }

    // Check quota before processing
    // Use ffprobe for accurate duration instead of file-size estimation
    const fileSizeBytes = file.size;
    let actualDurationMinutes: number;
    try {
      const durationSeconds =
        await this.transcriptionService.getAudioDurationFromBuffer(
          file.buffer,
          file.mimetype,
        );
      actualDurationMinutes = Math.ceil(durationSeconds / 60);
      this.logger.log(
        `Actual duration from ffprobe: ${actualDurationMinutes} minutes (${durationSeconds.toFixed(1)}s)`,
      );
    } catch (error) {
      // Fallback to estimation if ffprobe fails (e.g., corrupted file)
      this.logger.warn(
        'FFprobe failed, falling back to file-size estimation:',
        error,
      );
      actualDurationMinutes = this.estimateDuration(
        fileSizeBytes,
        file.mimetype,
      );
    }
    await this.usageService.checkQuota(
      req.user.uid,
      fileSizeBytes,
      actualDurationMinutes,
    );

    // V2: Parse selectedTemplates from JSON string
    let selectedTemplates: string[] | undefined;
    if (selectedTemplatesJson) {
      try {
        selectedTemplates = JSON.parse(selectedTemplatesJson);
        this.logger.log(
          `Parsed selectedTemplates: ${JSON.stringify(selectedTemplates)}`,
        );
      } catch (e) {
        this.logger.warn('Failed to parse selectedTemplates JSON:', e);
      }
    }

    const transcription = await this.transcriptionService.createTranscription(
      req.user.uid,
      file,
      analysisType,
      context,
      contextId,
      selectedTemplates,
    );

    return {
      success: true,
      data: transcription,
      message: 'File uploaded successfully and queued for transcription',
    };
  }

  @Post('upload-batch')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 2, ttl: 60000 } }) // 2 batch uploads per minute
  @UseInterceptors(
    FilesInterceptor('files', 3, {
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    }),
  )
  async uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('mergeFiles') mergeFiles: string,
    @Body('analysisType') analysisType: AnalysisType,
    @Body('context') context: string,
    @Body('contextId') contextId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<BatchUploadResponse>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 3) {
      throw new BadRequestException('Maximum 3 files allowed');
    }

    console.log('Received batch upload:', {
      fileCount: files.length,
      mergeFiles: mergeFiles === 'true',
      files: files.map((f) => ({
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
      })),
    });

    // Validate all files
    for (const file of files) {
      if (!isValidAudioFile(file.originalname, file.mimetype)) {
        throw new BadRequestException(
          `Invalid audio file format: ${file.originalname} (${file.mimetype})`,
        );
      }

      if (!validateFileSize(file.size)) {
        throw new BadRequestException(
          `File size exceeds limit: ${file.originalname}`,
        );
      }
    }

    // Check quota for each file before processing
    // Use ffprobe for accurate duration instead of file-size estimation
    for (const file of files) {
      const fileSizeBytes = file.size;
      let actualDurationMinutes: number;
      try {
        const durationSeconds =
          await this.transcriptionService.getAudioDurationFromBuffer(
            file.buffer,
            file.mimetype,
          );
        actualDurationMinutes = Math.ceil(durationSeconds / 60);
        this.logger.log(
          `Batch file ${file.originalname}: ${actualDurationMinutes} minutes from ffprobe`,
        );
      } catch (error) {
        // Fallback to estimation if ffprobe fails
        this.logger.warn(
          `FFprobe failed for ${file.originalname}, using estimation:`,
          error,
        );
        actualDurationMinutes = this.estimateDuration(
          fileSizeBytes,
          file.mimetype,
        );
      }
      await this.usageService.checkQuota(
        req.user.uid,
        fileSizeBytes,
        actualDurationMinutes,
      );
    }

    const shouldMerge = mergeFiles === 'true';
    const result = await this.transcriptionService.createBatchTranscription(
      req.user.uid,
      files,
      shouldMerge,
      analysisType,
      context,
      contextId,
    );

    return {
      success: true,
      data: result,
      message: shouldMerge
        ? 'Files merged and queued for transcription'
        : `${files.length} files uploaded and queued for transcription`,
    };
  }

  /**
   * Process a chunked recording from Firebase Storage
   * Called after ChunkUploader has finished uploading chunks to Firebase Storage
   * Backend will download, merge with FFmpeg, and process the recording
   */
  @Post('process-session')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 per minute (processing is expensive)
  async processRecordingSession(
    @Body('sessionId') sessionId: string,
    @Body('analysisType') analysisType: AnalysisType,
    @Body('context') context: string,
    @Body('contextId') contextId: string,
    @Body('selectedTemplates') selectedTemplatesJson: string,
    @Body('folderId') folderId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<Transcription>> {
    if (!sessionId) {
      throw new BadRequestException('Session ID is required');
    }

    // Validate session ID format (prevent path traversal)
    // Format: timestamp_randomId (e.g., 1234567890123_AbCdEf12)
    if (!/^\d+_[a-zA-Z0-9]+$/.test(sessionId)) {
      throw new BadRequestException('Invalid session ID format');
    }

    this.logger.log(`Processing chunked recording session: ${sessionId}`);

    // Parse selectedTemplates if provided
    let selectedTemplates: string[] | undefined;
    if (selectedTemplatesJson) {
      try {
        selectedTemplates = JSON.parse(selectedTemplatesJson);
      } catch (e) {
        this.logger.warn('Failed to parse selectedTemplates JSON:', e);
      }
    }

    const transcription =
      await this.transcriptionService.processChunkedRecording(
        req.user.uid,
        sessionId,
        analysisType,
        context,
        contextId,
        selectedTemplates,
        folderId,
      );

    return {
      success: true,
      data: transcription,
      message: 'Chunked recording queued for transcription',
    };
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  async getTranscriptions(
    @Req() req: Request & { user: any },
    @Query() paginationDto: PaginationDto,
  ): Promise<ApiResponse<PaginatedResponse<Transcription>>> {
    const result = await this.transcriptionService.getTranscriptions(
      req.user.uid,
      paginationDto.page,
      paginationDto.pageSize,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Search transcriptions by query string
   * Searches across title, fileName, and summary content
   */
  @Get('search')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 30, ttl: 60000 } }) // 30 searches per minute
  async searchTranscriptions(
    @Req() req: Request & { user: any },
    @Query() searchDto: SearchTranscriptionsDto,
  ): Promise<ApiResponse<{ items: Partial<Transcription>[]; total: number }>> {
    const result = await this.transcriptionService.searchTranscriptions(
      req.user.uid,
      searchDto.query,
      searchDto.limit,
    );

    return {
      success: true,
      data: result,
    };
  }

  // ============================================================
  // ANALYSIS TEMPLATE ENDPOINTS (Must come before :id routes!)
  // ============================================================

  /**
   * Get all available analysis templates
   */
  @Get('analysis-templates')
  async getAnalysisTemplates(): Promise<ApiResponse<AnalysisTemplate[]>> {
    const templates = this.templateService.getTemplates();
    return Promise.resolve({
      success: true,
      data: templates,
    });
  }

  /**
   * Get a specific analysis template by ID
   */
  @Get('analysis-templates/:templateId')
  async getAnalysisTemplate(
    @Param('templateId') templateId: string,
  ): Promise<ApiResponse<AnalysisTemplate>> {
    const template = this.templateService.getTemplateById(templateId);

    if (!template) {
      throw new BadRequestException(`Template not found: ${templateId}`);
    }

    return Promise.resolve({
      success: true,
      data: template,
    });
  }

  /**
   * Get recent AI-generated analyses for the current user
   * Used for the dashboard "Recent Outputs" section
   */
  @Get('recent-analyses')
  @UseGuards(FirebaseAuthGuard)
  async getRecentAnalyses(
    @Query('limit') limit: string = '8',
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<any[]>> {
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 20);
    const analyses = await this.transcriptionService.getRecentAnalyses(
      req.user.uid,
      parsedLimit,
    );

    return {
      success: true,
      data: analyses,
    };
  }

  /**
   * Get recent AI-generated analyses for conversations in a specific folder
   * Used for the folder page "Recent Outputs" section
   */
  @Get('recent-analyses/folder/:folderId')
  @UseGuards(FirebaseAuthGuard)
  async getRecentAnalysesByFolder(
    @Param('folderId') folderId: string,
    @Query('limit') limit: string = '8',
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<any[]>> {
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 20);
    const analyses = await this.transcriptionService.getRecentAnalysesByFolder(
      req.user.uid,
      folderId,
      parsedLimit,
    );

    return {
      success: true,
      data: analyses,
    };
  }

  /**
   * Get recently opened conversations for the current user
   * Returns conversations ordered by lastAccessedAt (most recent first)
   */
  @Get('recently-opened')
  @UseGuards(FirebaseAuthGuard)
  async getRecentlyOpened(
    @Query('limit') limit: string = '5',
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<Transcription[]>> {
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10);
    const transcriptions =
      await this.transcriptionService.getRecentlyOpenedTranscriptions(
        req.user.uid,
        parsedLimit,
      );

    return {
      success: true,
      data: transcriptions,
    };
  }

  /**
   * Clear recently opened history for the current user
   * Removes lastAccessedAt from all user's transcriptions
   */
  @Delete('recently-opened')
  @UseGuards(FirebaseAuthGuard)
  async clearRecentlyOpened(
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<{ cleared: number }>> {
    const cleared = await this.transcriptionService.clearRecentlyOpened(
      req.user.uid,
    );

    return {
      success: true,
      data: { cleared },
      message: 'Recently opened history cleared',
    };
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async getTranscription(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<Transcription>> {
    const transcription = await this.transcriptionService.getTranscription(
      req.user.uid,
      id,
    );

    if (!transcription) {
      throw new BadRequestException('Transcription not found');
    }

    return {
      success: true,
      data: transcription,
    };
  }

  /**
   * Record that the user accessed/opened a conversation
   * Updates the lastAccessedAt timestamp for "Recently Opened" tracking
   */
  @Post(':id/access')
  @UseGuards(FirebaseAuthGuard)
  async recordAccess(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<{ message: string }>> {
    await this.transcriptionService.recordTranscriptionAccess(req.user.uid, id);

    return {
      success: true,
      data: { message: 'Access recorded' },
    };
  }

  @Put(':id/title')
  @UseGuards(FirebaseAuthGuard)
  async updateTitle(
    @Param('id') id: string,
    @Body('title') title: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<Transcription>> {
    if (!title || title.trim() === '') {
      throw new BadRequestException('Title cannot be empty');
    }

    const transcription = await this.transcriptionService.updateTitle(
      req.user.uid,
      id,
      title.trim(),
    );

    return {
      success: true,
      data: transcription,
      message: 'Title updated successfully',
    };
  }

  /**
   * Move transcription to a folder (or remove from folder with null)
   */
  @Patch(':id/folder')
  @UseGuards(FirebaseAuthGuard)
  async moveToFolder(
    @Param('id') id: string,
    @Body('folderId') folderId: string | null,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<{ message: string }>> {
    await this.transcriptionService.moveToFolder(req.user.uid, id, folderId);

    return {
      success: true,
      data: {
        message: folderId
          ? 'Transcription moved to folder'
          : 'Transcription removed from folder',
      },
    };
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async deleteTranscription(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    await this.transcriptionService.deleteTranscription(req.user.uid, id);

    return {
      success: true,
      message: 'Transcription deleted successfully',
    };
  }

  // Comment endpoints
  @Post(':id/comments')
  @UseGuards(FirebaseAuthGuard)
  async addComment(
    @Param('id') transcriptionId: string,
    @Body() dto: AddCommentDto,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<SummaryComment>> {
    // Sanitize content to prevent XSS
    const DOMPurify = (await import('isomorphic-dompurify')).default;
    const sanitizedContent = DOMPurify.sanitize(dto.content, {
      ALLOWED_TAGS: [], // Strip all HTML
      ALLOWED_ATTR: [],
    });

    const comment = await this.transcriptionService.addSummaryComment(
      transcriptionId,
      req.user.uid,
      dto.position,
      sanitizedContent,
    );

    return {
      success: true,
      data: comment,
      message: 'Comment added successfully',
    };
  }

  @Get(':id/comments')
  @UseGuards(FirebaseAuthGuard)
  async getComments(
    @Param('id') transcriptionId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<SummaryComment[]>> {
    const comments = await this.transcriptionService.getSummaryComments(
      transcriptionId,
      req.user.uid,
    );

    return {
      success: true,
      data: comments,
    };
  }

  @Put(':id/comments/:commentId')
  @UseGuards(FirebaseAuthGuard)
  async updateComment(
    @Param('id') transcriptionId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<SummaryComment>> {
    // Sanitize content if provided
    const updates: any = { ...dto };
    if (dto.content) {
      const DOMPurify = (await import('isomorphic-dompurify')).default;
      updates.content = DOMPurify.sanitize(dto.content, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });
    }

    const comment = await this.transcriptionService.updateSummaryComment(
      transcriptionId,
      commentId,
      req.user.uid,
      updates,
    );

    return {
      success: true,
      data: comment,
      message: 'Comment updated successfully',
    };
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(FirebaseAuthGuard)
  async deleteComment(
    @Param('id') transcriptionId: string,
    @Param('commentId') commentId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    await this.transcriptionService.deleteSummaryComment(
      transcriptionId,
      commentId,
      req.user.uid,
    );

    return {
      success: true,
      message: 'Comment deleted successfully',
    };
  }

  @Post(':id/regenerate-summary')
  @UseGuards(FirebaseAuthGuard)
  async regenerateSummary(
    @Param('id') transcriptionId: string,
    @Body() request: { instructions?: string },
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<Transcription>> {
    const transcription = await this.transcriptionService.regenerateSummary(
      transcriptionId,
      req.user.uid,
      request.instructions,
    );

    return {
      success: true,
      data: transcription,
      message: 'Summary regeneration started',
    };
  }

  // Share endpoints
  @Post(':id/share')
  @UseGuards(FirebaseAuthGuard)
  async createShareLink(
    @Param('id') transcriptionId: string,
    @Body() dto: CreateShareLinkDto,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<{ shareToken: string; shareUrl: string }>> {
    // Hash password before storing if provided
    const shareSettings: any = { ...dto };
    if (dto.password) {
      const bcrypt = await import('bcrypt');
      shareSettings.password = await bcrypt.hash(dto.password, 10);
    }

    const result = await this.transcriptionService.createShareLink(
      transcriptionId,
      req.user.uid,
      shareSettings,
    );

    return {
      success: true,
      data: result,
      message: 'Share link created successfully',
    };
  }

  @Delete(':id/share')
  @UseGuards(FirebaseAuthGuard)
  async revokeShareLink(
    @Param('id') transcriptionId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    await this.transcriptionService.revokeShareLink(
      transcriptionId,
      req.user.uid,
    );

    return {
      success: true,
      message: 'Share link revoked successfully',
    };
  }

  @Put(':id/share-settings')
  @UseGuards(FirebaseAuthGuard)
  async updateShareSettings(
    @Param('id') transcriptionId: string,
    @Body() dto: UpdateShareSettingsDto,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    // Hash password before storing if provided
    const shareSettings: any = { ...dto };
    if (dto.password) {
      const bcrypt = await import('bcrypt');
      shareSettings.password = await bcrypt.hash(dto.password, 10);
    }

    await this.transcriptionService.updateShareSettings(
      transcriptionId,
      req.user.uid,
      shareSettings,
    );

    return {
      success: true,
      message: 'Share settings updated successfully',
    };
  }

  @Post(':id/share/email')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 10, ttl: 3600000 } }) // 10 emails per hour
  async sendShareEmail(
    @Param('id') transcriptionId: string,
    @Body() dto: SendShareEmailDto,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    const success = await this.transcriptionService.sendShareEmail(
      transcriptionId,
      req.user.uid,
      dto,
    );

    if (!success) {
      throw new BadRequestException('Failed to send share email');
    }

    return {
      success: true,
      message: 'Share email sent successfully',
    };
  }

  // Translation endpoints
  @Post(':id/translate')
  @UseGuards(FirebaseAuthGuard)
  async translateTranscription(
    @Param('id') transcriptionId: string,
    @Body('targetLanguage') targetLanguage: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    if (!targetLanguage) {
      throw new BadRequestException('Target language is required');
    }

    const translationData =
      await this.transcriptionService.translateTranscription(
        transcriptionId,
        req.user.uid,
        targetLanguage,
      );

    return {
      success: true,
      data: translationData,
      message: `Translation to ${translationData.languageName} completed successfully`,
    };
  }

  @Get(':id/translations/:language')
  @UseGuards(FirebaseAuthGuard)
  async getTranslation(
    @Param('id') transcriptionId: string,
    @Param('language') language: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    const translationData = await this.transcriptionService.getTranslation(
      transcriptionId,
      req.user.uid,
      language,
    );

    return {
      success: true,
      data: translationData,
    };
  }

  @Delete(':id/translations/:language')
  @UseGuards(FirebaseAuthGuard)
  async deleteTranslation(
    @Param('id') transcriptionId: string,
    @Param('language') language: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    await this.transcriptionService.deleteTranslation(
      transcriptionId,
      req.user.uid,
      language,
    );

    return {
      success: true,
      message: 'Translation deleted successfully',
    };
  }

  @Patch(':id/translation-preference')
  @UseGuards(FirebaseAuthGuard)
  async updateTranslationPreference(
    @Param('id') transcriptionId: string,
    @Body('languageCode') languageCode: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    await this.transcriptionService.updateTranslationPreference(
      transcriptionId,
      req.user.uid,
      languageCode,
    );

    return {
      success: true,
      message: 'Translation preference updated successfully',
    };
  }

  // ============================================================
  // ON-DEMAND ANALYSIS ENDPOINTS
  // ============================================================

  /**
   * Generate an on-demand analysis for a transcription
   */
  @Post(':id/generate-analysis')
  @UseGuards(FirebaseAuthGuard)
  async generateAnalysis(
    @Param('id') transcriptionId: string,
    @Body('templateId') templateId: string,
    @Body('customInstructions') customInstructions: string | undefined,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<GeneratedAnalysis>> {
    if (!templateId) {
      throw new BadRequestException('Template ID is required');
    }

    // Check quota before generating
    await this.usageService.checkOnDemandAnalysisQuota(req.user.uid);

    const analysis = await this.onDemandAnalysisService.generateFromTemplate(
      transcriptionId,
      templateId,
      req.user.uid,
      customInstructions,
    );

    // Track usage after successful generation
    await this.usageService.trackOnDemandAnalysis(req.user.uid, analysis.id);

    return {
      success: true,
      data: analysis,
    };
  }

  /**
   * Get all generated analyses for a transcription
   */
  @Get(':id/analyses')
  @UseGuards(FirebaseAuthGuard)
  async getUserAnalyses(
    @Param('id') transcriptionId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<GeneratedAnalysis[]>> {
    const analyses = await this.onDemandAnalysisService.getUserAnalyses(
      transcriptionId,
      req.user.uid,
    );

    return {
      success: true,
      data: analyses,
    };
  }

  /**
   * Get a single generated analysis by ID
   */
  @Get(':id/analyses/:analysisId')
  @UseGuards(FirebaseAuthGuard)
  async getAnalysis(
    @Param('id') transcriptionId: string,
    @Param('analysisId') analysisId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<GeneratedAnalysis>> {
    const analysis = await this.onDemandAnalysisService.getAnalysisById(
      analysisId,
      req.user.uid,
    );

    return {
      success: true,
      data: analysis,
    };
  }

  /**
   * Delete a generated analysis
   */
  @Delete(':id/analyses/:analysisId')
  @UseGuards(FirebaseAuthGuard)
  async deleteAnalysis(
    @Param('id') transcriptionId: string,
    @Param('analysisId') analysisId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse> {
    await this.onDemandAnalysisService.deleteAnalysis(analysisId, req.user.uid);

    return {
      success: true,
      message: 'Analysis deleted successfully',
    };
  }

  /**
   * Generate a hero image for an existing blog post analysis (Premium only)
   */
  @Post(':id/analyses/:analysisId/generate-image')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 image generations per minute
  async generateBlogImage(
    @Param('id') transcriptionId: string,
    @Param('analysisId') analysisId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<{ heroImage: BlogHeroImage }>> {
    const heroImage =
      await this.onDemandAnalysisService.generateImageForBlogPost(
        analysisId,
        req.user.uid,
      );

    return {
      success: true,
      data: { heroImage },
      message: 'Hero image generated successfully',
    };
  }

  /**
   * Send an email analysis draft to the user's own email address
   * Rate limited to 5 emails per minute to prevent abuse
   */
  @Post('analyses/:analysisId/send-to-self')
  @UseGuards(FirebaseAuthGuard)
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 emails per minute
  async sendEmailToSelf(
    @Param('analysisId') analysisId: string,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<{ message: string }>> {
    const result = await this.onDemandAnalysisService.sendEmailToSelf(
      analysisId,
      req.user.uid,
    );

    return {
      success: result.success,
      data: { message: result.message },
      message: result.message,
    };
  }

  /**
   * Estimate audio duration based on file size and mime type
   * This is a rough estimate - actual duration will be determined after transcription
   */
  private estimateDuration(fileSizeBytes: number, mimeType: string): number {
    const fileSizeMB = fileSizeBytes / (1024 * 1024);

    // Different compression rates for different formats
    // These are rough estimates in MB per minute
    const compressionRates: Record<string, number> = {
      'audio/mp3': 1.0, // ~1MB per minute
      'audio/mpeg': 1.0,
      'audio/m4a': 0.8, // Better compression
      'audio/x-m4a': 0.8,
      'audio/mp4': 0.8,
      'audio/wav': 10.0, // Uncompressed, ~10MB per minute
      'audio/flac': 6.0, // Lossless, ~6MB per minute
      'audio/ogg': 0.7,
      'audio/webm': 0.7,
      'video/mp4': 2.0, // Video files tend to be larger
      'video/webm': 1.5,
      default: 1.0, // Default assumption
    };

    const rate = compressionRates[mimeType] || compressionRates.default;
    const estimatedMinutes = Math.ceil(fileSizeMB / rate);

    // Cap estimate at reasonable max (e.g., 8 hours = 480 minutes)
    return Math.min(estimatedMinutes, 480);
  }

  /**
   * Ask a question about a specific conversation
   * Uses semantic search to find relevant context and synthesizes an answer with citations
   */
  @Post(':id/ask')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async askQuestion(
    @Param('id') transcriptionId: string,
    @Body() body: AskQuestionDto,
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<AskResponse>> {
    const userId = req.user.uid;

    // Check if vector search is available
    if (!this.vectorService.isAvailable()) {
      throw new ServiceUnavailableException('Q&A feature is not available');
    }

    const response = await this.vectorService.askConversation(
      userId,
      transcriptionId,
      body.question,
      body.maxResults,
      body.history,
    );

    return {
      success: true,
      data: response,
    };
  }

  /**
   * Get indexing status for a conversation (for Q&A feature)
   */
  @Get(':id/indexing-status')
  @UseGuards(FirebaseAuthGuard)
  async getIndexingStatus(
    @Param('id') transcriptionId: string,
    @Req() req: Request & { user: any },
  ): Promise<
    ApiResponse<{ indexed: boolean; chunkCount: number; indexedAt?: Date }>
  > {
    const userId = req.user.uid;

    const status = await this.vectorService.getIndexingStatus(
      userId,
      transcriptionId,
    );

    return {
      success: true,
      data: status,
    };
  }

  /**
   * Merge multiple audio files into a single file
   * Used for combining recovered recording chunks with new recording on the frontend
   * This is much faster than client-side merging using Web Audio API
   *
   * Returns the merged audio as base64-encoded data along with metadata
   */
  @Post('merge-audio')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, { limits: { fileSize: 500 * 1024 * 1024 } }),
  ) // Max 10 files, 500MB each
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 merges per minute
  async mergeAudio(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: any },
  ): Promise<
    ApiResponse<{
      duration: number;
      mimeType: string;
      base64: string;
      size: number;
    }>
  > {
    if (!files || files.length < 2) {
      throw new BadRequestException(
        'At least 2 audio files are required for merging',
      );
    }

    this.logger.log(
      `[mergeAudio] User ${req.user.uid} merging ${files.length} audio files`,
    );

    try {
      const result = await this.transcriptionService.mergeAudioFiles(files);

      // Return the merged audio as base64
      return {
        success: true,
        data: {
          duration: result.duration,
          mimeType: result.mimeType,
          base64: result.buffer.toString('base64'),
          size: result.buffer.length,
        },
      };
    } catch (error) {
      this.logger.error(`[mergeAudio] Failed to merge audio:`, error);
      throw new BadRequestException(
        `Failed to merge audio files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
