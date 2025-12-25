import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { TranslationService } from './translation.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import type {
  Translation,
  ConversationTranslations,
  TranslateConversationRequest,
  TranslateConversationResponse,
} from '@transcribe/shared';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Controller('translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  // ============================================================
  // AUTHENTICATED ENDPOINTS
  // ============================================================

  /**
   * Translate conversation content to target locale
   */
  @Post(':transcriptionId')
  @UseGuards(FirebaseAuthGuard)
  async translateConversation(
    @Param('transcriptionId') transcriptionId: string,
    @Body() body: TranslateConversationRequest,
    @Req() req: Request & { user: { uid: string } },
  ): Promise<ApiResponse<TranslateConversationResponse>> {
    const result = await this.translationService.translateConversation(
      transcriptionId,
      req.user.uid,
      body.targetLocale,
      {
        translateSummary: body.translateSummary ?? true,
        translateAssets: body.translateAssets ?? true,
        assetIds: body.assetIds,
      },
    );

    return {
      success: true,
      data: result,
      message: `Translation to ${result.localeName} completed`,
    };
  }

  /**
   * Get translation status for a conversation
   */
  @Get(':transcriptionId/status')
  @UseGuards(FirebaseAuthGuard)
  async getTranslationStatus(
    @Param('transcriptionId') transcriptionId: string,
    @Req() req: Request & { user: { uid: string } },
  ): Promise<ApiResponse<ConversationTranslations>> {
    const status = await this.translationService.getTranslationStatus(
      transcriptionId,
      req.user.uid,
    );

    return { success: true, data: status };
  }

  /**
   * Get all translations for a specific locale
   */
  @Get(':transcriptionId/:localeCode')
  @UseGuards(FirebaseAuthGuard)
  async getTranslationsForLocale(
    @Param('transcriptionId') transcriptionId: string,
    @Param('localeCode') localeCode: string,
    @Req() req: Request & { user: { uid: string } },
  ): Promise<ApiResponse<Translation[]>> {
    const translations = await this.translationService.getTranslationsForLocale(
      transcriptionId,
      localeCode,
      req.user.uid,
    );

    return { success: true, data: translations };
  }

  /**
   * Delete all translations for a locale
   */
  @Delete(':transcriptionId/:localeCode')
  @UseGuards(FirebaseAuthGuard)
  async deleteTranslationsForLocale(
    @Param('transcriptionId') transcriptionId: string,
    @Param('localeCode') localeCode: string,
    @Req() req: Request & { user: { uid: string } },
  ): Promise<ApiResponse<{ deletedCount: number }>> {
    const deletedCount =
      await this.translationService.deleteTranslationsForLocale(
        transcriptionId,
        localeCode,
        req.user.uid,
      );

    return {
      success: true,
      data: { deletedCount },
      message: `Deleted ${deletedCount} translations`,
    };
  }

  /**
   * Update locale preference for a conversation
   */
  @Patch(':transcriptionId/preference')
  @UseGuards(FirebaseAuthGuard)
  async updateLocalePreference(
    @Param('transcriptionId') transcriptionId: string,
    @Body('localeCode') localeCode: string,
    @Req() req: Request & { user: { uid: string } },
  ): Promise<ApiResponse> {
    await this.translationService.updateLocalePreference(
      transcriptionId,
      localeCode,
      req.user.uid,
    );

    return { success: true, message: 'Locale preference updated' };
  }

  // ============================================================
  // PUBLIC ENDPOINTS (FOR SHARED CONVERSATIONS)
  // ============================================================

  /**
   * Get translation status for a shared conversation
   */
  @Get('shared/:shareToken/status')
  async getSharedTranslationStatus(
    @Param('shareToken') shareToken: string,
    @Query('transcriptionId') transcriptionId: string,
  ): Promise<ApiResponse<ConversationTranslations>> {
    const status = await this.translationService.getSharedTranslationStatus(
      transcriptionId,
      shareToken,
    );

    return { success: true, data: status };
  }

  /**
   * Get translations for a specific locale (shared conversation)
   */
  @Get('shared/:shareToken/:localeCode')
  async getSharedTranslationsForLocale(
    @Param('shareToken') shareToken: string,
    @Param('localeCode') localeCode: string,
    @Query('transcriptionId') transcriptionId: string,
  ): Promise<ApiResponse<Translation[]>> {
    const translations =
      await this.translationService.getSharedTranslationsForLocale(
        transcriptionId,
        localeCode,
        shareToken,
      );

    return { success: true, data: translations };
  }
}
