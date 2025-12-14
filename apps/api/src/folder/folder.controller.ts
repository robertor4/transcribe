import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { FirebaseService } from '../firebase/firebase.service';
import type { ApiResponse, Folder, Transcription } from '@transcribe/shared';
import { CreateFolderDto, UpdateFolderDto } from './folder.dto';

@Controller('folders')
@UseGuards(FirebaseAuthGuard)
export class FolderController {
  private readonly logger = new Logger(FolderController.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Create a new folder
   */
  @Post()
  async createFolder(
    @Req() req: Request,
    @Body() body: CreateFolderDto,
  ): Promise<ApiResponse<Folder>> {
    const userId = (req as any).user.uid;

    if (!body.name || body.name.trim() === '') {
      throw new HttpException(
        'Folder name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const folderId = await this.firebaseService.createFolder(userId, {
      name: body.name.trim(),
      color: body.color,
    });

    const folder = await this.firebaseService.getFolder(userId, folderId);

    this.logger.log(`Created folder ${folderId} for user ${userId}`);

    return {
      success: true,
      data: folder!,
    };
  }

  /**
   * Get all folders for the current user
   */
  @Get()
  async getFolders(@Req() req: Request): Promise<ApiResponse<Folder[]>> {
    const userId = (req as any).user.uid;

    const folders = await this.firebaseService.getUserFolders(userId);

    return {
      success: true,
      data: folders,
    };
  }

  /**
   * Get a single folder by ID
   */
  @Get(':id')
  async getFolder(
    @Req() req: Request,
    @Param('id') folderId: string,
  ): Promise<ApiResponse<Folder>> {
    const userId = (req as any).user.uid;

    const folder = await this.firebaseService.getFolder(userId, folderId);

    if (!folder) {
      throw new HttpException('Folder not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: folder,
    };
  }

  /**
   * Get transcriptions in a folder
   */
  @Get(':id/transcriptions')
  async getFolderTranscriptions(
    @Req() req: Request,
    @Param('id') folderId: string,
  ): Promise<ApiResponse<Transcription[]>> {
    const userId = (req as any).user.uid;

    // Verify folder exists and belongs to user
    const folder = await this.firebaseService.getFolder(userId, folderId);
    if (!folder) {
      throw new HttpException('Folder not found', HttpStatus.NOT_FOUND);
    }

    const transcriptions = await this.firebaseService.getTranscriptionsByFolder(
      userId,
      folderId,
    );

    return {
      success: true,
      data: transcriptions,
    };
  }

  /**
   * Update a folder
   */
  @Put(':id')
  async updateFolder(
    @Req() req: Request,
    @Param('id') folderId: string,
    @Body() body: UpdateFolderDto,
  ): Promise<ApiResponse<Folder>> {
    const userId = (req as any).user.uid;

    // Validate name if provided
    if (body.name !== undefined && body.name.trim() === '') {
      throw new HttpException(
        'Folder name cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.firebaseService.updateFolder(userId, folderId, {
        name: body.name?.trim(),
        color: body.color,
        sortOrder: body.sortOrder,
      });

      const folder = await this.firebaseService.getFolder(userId, folderId);

      this.logger.log(`Updated folder ${folderId}`);

      return {
        success: true,
        data: folder!,
      };
    } catch (error: any) {
      if (error.message === 'Folder not found or access denied') {
        throw new HttpException('Folder not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * Delete a folder
   *
   * @query deleteContents - If 'true', soft-delete all conversations in the folder
   *                         If 'false' or omitted, move conversations to unfiled
   * @query confirm - Must be 'true' when deleteContents='true' (safety check)
   *
   * Soft delete means conversations are marked as deleted but can be recovered.
   */
  @Delete(':id')
  async deleteFolder(
    @Req() req: Request,
    @Param('id') folderId: string,
    @Query('deleteContents') deleteContents?: string,
    @Query('confirm') confirm?: string,
  ): Promise<ApiResponse<{ message: string; deletedConversations?: number }>> {
    const userId = (req as any).user.uid;
    const shouldDeleteContents = deleteContents === 'true';

    // Safety check: require confirmation when deleting contents
    if (shouldDeleteContents && confirm !== 'true') {
      throw new HttpException(
        'Deleting folder contents requires confirm=true parameter',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.firebaseService.deleteFolder(
        userId,
        folderId,
        shouldDeleteContents,
      );

      this.logger.log(
        `Deleted folder ${folderId}${shouldDeleteContents ? ` with ${result.deletedConversations} conversations` : ''}`,
      );

      return {
        success: true,
        data: {
          message: shouldDeleteContents
            ? `Folder and ${result.deletedConversations} conversations deleted`
            : 'Folder deleted, conversations moved to unfiled',
          deletedConversations: result.deletedConversations,
        },
      };
    } catch (error: any) {
      if (error.message === 'Folder not found or access denied') {
        throw new HttpException('Folder not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }
}
