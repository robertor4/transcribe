import {
  Controller,
  Post,
  Get,
  Delete,
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
  Transcription 
} from '@transcribe/shared';

@Controller('transcriptions')
@UseGuards(FirebaseAuthGuard)
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 500 * 1024 * 1024, // 500MB - We can now handle larger files with splitting
    },
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
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
      console.log('Validation failed for file:', file.originalname, 'with mimetype:', file.mimetype);
      throw new BadRequestException(`Invalid audio file format (${file.mimetype})`);
    }

    if (!validateFileSize(file.size)) {
      throw new BadRequestException('File size exceeds limit');
    }

    const transcription = await this.transcriptionService.createTranscription(
      req.user.uid,
      file,
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
}