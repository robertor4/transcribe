import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  ValidateNested,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { FindReplacePatternCategory } from '@transcribe/shared';

class SaveAsPatternDto {
  @IsEnum(['person_name', 'company_name', 'place', 'technical_term', 'custom'])
  category: FindReplacePatternCategory;
}

export class ReplaceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  findText: string;

  @IsString()
  @MaxLength(500)
  replaceText: string;

  @IsBoolean()
  caseSensitive: boolean;

  @IsBoolean()
  wholeWord: boolean;

  @IsOptional()
  @IsBoolean()
  replaceAll?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(['summary', 'transcript', 'aiAssets'], { each: true })
  replaceCategories?: ('summary' | 'transcript' | 'aiAssets')[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  matchIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveAsPatternDto)
  saveAsPattern?: SaveAsPatternDto;
}
