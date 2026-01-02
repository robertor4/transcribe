import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchTranscriptionsDto {
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters' })
  @MaxLength(100, { message: 'Search query cannot exceed 100 characters' })
  query: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
