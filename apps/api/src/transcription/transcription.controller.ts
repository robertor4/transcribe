import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { TranscriptionService } from './transcription.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import {
  isValidAudioFile,
  validateFileSize,
  ApiResponse,
  PaginatedResponse,
  Transcription,
  SummaryComment,
  RegenerateSummaryRequest,
  AnalysisType,
} from '@transcribe/shared';

@Controller('transcriptions')
@UseGuards(FirebaseAuthGuard)
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB - We can now handle larger files with splitting
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('analysisType') analysisType: AnalysisType,
    @Body('context') context: string,
    @Body('contextId') contextId: string,
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

    const transcription = await this.transcriptionService.createTranscription(
      req.user.uid,
      file,
      analysisType,
      context,
      contextId,
    );

    return {
      success: true,
      data: transcription,
      message: 'File uploaded successfully and queued for transcription',
    };
  }

  @Get()
  async getTranscriptions(
    @Req() req: Request & { user: any },
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 20,
  ): Promise<ApiResponse<PaginatedResponse<Transcription>>> {
    const result = await this.transcriptionService.getTranscriptions(
      req.user.uid,
      page,
      pageSize,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
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

  @Put(':id/title')
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

  @Delete(':id')
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
  async addComment(
    @Param('id') transcriptionId: string,
    @Body() commentData: { position: any; content: string },
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<SummaryComment>> {
    const comment = await this.transcriptionService.addSummaryComment(
      transcriptionId,
      req.user.uid,
      commentData.position,
      commentData.content,
    );

    return {
      success: true,
      data: comment,
      message: 'Comment added successfully',
    };
  }

  @Get(':id/comments')
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
  async updateComment(
    @Param('id') transcriptionId: string,
    @Param('commentId') commentId: string,
    @Body() updates: { content?: string; resolved?: boolean },
    @Req() req: Request & { user: any },
  ): Promise<ApiResponse<SummaryComment>> {
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
}
