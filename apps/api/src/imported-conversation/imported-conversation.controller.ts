import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ImportedConversationService } from './imported-conversation.service';
import { ImportConversationDto } from './imported-conversation.dto';
import type {
  ApiResponse,
  ImportedConversation,
  ImportConversationResponse,
  ImportedConversationWithContent,
} from '@transcribe/shared';

@Controller('imported-conversations')
@UseGuards(FirebaseAuthGuard)
export class ImportedConversationController {
  private readonly logger = new Logger(ImportedConversationController.name);

  constructor(
    private readonly importedConversationService: ImportedConversationService,
  ) {}

  /**
   * Import a shared conversation by its share token.
   * Creates a linked reference to the original share.
   */
  @Post(':shareToken')
  @HttpCode(HttpStatus.CREATED)
  async importConversation(
    @Req() req: Request,
    @Param('shareToken') shareToken: string,
    @Body() body: ImportConversationDto,
  ): Promise<ApiResponse<ImportConversationResponse>> {
    const userId = (req as any).user.uid;

    this.logger.log(
      `User ${userId} attempting to import share token ${shareToken}`,
    );

    const result = await this.importedConversationService.importConversation(
      userId,
      shareToken,
      body.password,
    );

    if (result.alreadyImported) {
      this.logger.log(`User ${userId} already imported share ${shareToken}`);
    } else {
      this.logger.log(`User ${userId} imported share ${shareToken}`);
    }

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get all imported conversations for the current user.
   */
  @Get()
  async getImports(
    @Req() req: Request,
  ): Promise<ApiResponse<ImportedConversation[]>> {
    const userId = (req as any).user.uid;

    const imports = await this.importedConversationService.getImports(userId);

    return {
      success: true,
      data: imports,
    };
  }

  /**
   * Get the count of imported conversations for the current user.
   */
  @Get('count')
  async getImportCount(
    @Req() req: Request,
  ): Promise<ApiResponse<{ count: number }>> {
    const userId = (req as any).user.uid;

    const count = await this.importedConversationService.getImportCount(userId);

    return {
      success: true,
      data: { count },
    };
  }

  /**
   * Get an imported conversation with its live content.
   * Validates the share is still accessible.
   */
  @Get(':id')
  async getImportWithContent(
    @Req() req: Request,
    @Param('id') importId: string,
  ): Promise<ApiResponse<ImportedConversationWithContent>> {
    const userId = (req as any).user.uid;

    const result = await this.importedConversationService.getImportWithContent(
      userId,
      importId,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Remove an imported conversation (soft delete).
   * This doesn't affect the original shared conversation.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async removeImport(
    @Req() req: Request,
    @Param('id') importId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const userId = (req as any).user.uid;

    await this.importedConversationService.removeImport(userId, importId);

    this.logger.log(`User ${userId} removed imported conversation ${importId}`);

    return {
      success: true,
      data: { message: 'Imported conversation removed' },
    };
  }

  /**
   * Check if the current user has imported a specific share.
   */
  @Get('check/:shareToken')
  async checkImportStatus(
    @Req() req: Request,
    @Param('shareToken') shareToken: string,
  ): Promise<ApiResponse<{ imported: boolean; importedAt?: Date }>> {
    const userId = (req as any).user.uid;

    const status = await this.importedConversationService.checkImportStatus(
      userId,
      shareToken,
    );

    return {
      success: true,
      data: status,
    };
  }
}
