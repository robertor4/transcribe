import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { UserService } from './user.service';
import { ApiResponse, User } from '@transcribe/shared';

@Controller('user')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req: Request): Promise<ApiResponse<User>> {
    const userId = (req as any).user.uid;
    const user = await this.userService.getUserProfile(userId);
    
    return {
      success: true,
      data: user,
    };
  }

  @Put('preferences')
  async updatePreferences(
    @Req() req: Request,
    @Body() preferences: { preferredLanguage?: string },
  ): Promise<ApiResponse<User>> {
    const userId = (req as any).user.uid;
    const updatedUser = await this.userService.updateUserPreferences(
      userId,
      preferences,
    );
    
    return {
      success: true,
      data: updatedUser,
    };
  }
}