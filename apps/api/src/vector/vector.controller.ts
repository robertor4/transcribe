import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { VectorService } from './vector.service';
import { AskQuestionDto, FindConversationsDto } from './dto/ask-question.dto';
import { AskResponse, FindResponse } from '@transcribe/shared';

interface AuthenticatedRequest {
  user: {
    uid: string;
    email: string;
  };
}

@Controller('vector')
@UseGuards(FirebaseAuthGuard)
export class VectorController {
  constructor(private vectorService: VectorService) {}

  /**
   * Ask a question across all user's conversations
   */
  @Post('ask')
  @HttpCode(HttpStatus.OK)
  async askGlobal(
    @Body() dto: AskQuestionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AskResponse> {
    return this.vectorService.askGlobal(
      req.user.uid,
      dto.question,
      dto.maxResults,
    );
  }

  /**
   * Find conversations matching a query (card view)
   */
  @Post('find')
  @HttpCode(HttpStatus.OK)
  async findConversations(
    @Body() dto: FindConversationsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<FindResponse> {
    return this.vectorService.findConversations(
      req.user.uid,
      dto.query,
      dto.folderId,
      dto.maxResults,
    );
  }

  /**
   * Health check for vector service
   */
  @Get('health')
  health(): { available: boolean } {
    return { available: this.vectorService.isAvailable() };
  }
}
