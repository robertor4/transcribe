import {
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsDate,
  IsNumber,
  IsObject,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { ShareContentOptions } from '@transcribe/shared';

export class CreateShareLinkDto {
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
    },
  )
  password?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxViews?: number;

  @IsOptional()
  @IsObject()
  contentOptions?: ShareContentOptions;
}

export class UpdateShareSettingsDto extends CreateShareLinkDto {}

export class SendShareEmailDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Invalid email format' })
  recipientEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  senderName?: string;
}
