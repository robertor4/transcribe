import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { FindReplaceService } from './find-replace.service';
import { FindDto } from './dto/find.dto';
import { ReplaceDto } from './dto/replace.dto';
import type { ApiResponse } from '@transcribe/shared';

@Controller()
@UseGuards(FirebaseAuthGuard)
export class FindReplaceController {
  constructor(private readonly findReplaceService: FindReplaceService) {}

  /**
   * Find matches in a conversation
   * POST /transcriptions/:id/find
   */
  @Post('transcriptions/:id/find')
  @HttpCode(HttpStatus.OK)
  async findMatches(
    @Param('id') transcriptionId: string,
    @Body() dto: FindDto,
    @Request() req: { user: { uid: string } },
  ): Promise<ApiResponse> {
    const results = await this.findReplaceService.findMatches(
      req.user.uid,
      transcriptionId,
      dto.findText,
      {
        caseSensitive: dto.caseSensitive ?? false,
        wholeWord: dto.wholeWord ?? false,
      },
    );

    return { success: true, data: results };
  }

  /**
   * Replace matches in a conversation
   * POST /transcriptions/:id/replace
   */
  @Post('transcriptions/:id/replace')
  @HttpCode(HttpStatus.OK)
  async replaceMatches(
    @Param('id') transcriptionId: string,
    @Body() dto: ReplaceDto,
    @Request() req: { user: { uid: string } },
  ): Promise<ApiResponse> {
    const result = await this.findReplaceService.replaceMatches(
      req.user.uid,
      transcriptionId,
      dto,
    );

    return { success: true, data: result };
  }
}
