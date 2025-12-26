import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single Q&A exchange for conversation history
 */
class QAHistoryItemDto {
  @IsString()
  @MaxLength(500)
  question: string;

  @IsString()
  @MaxLength(2000) // Answers can be longer than questions
  answer: string;
}

export class AskQuestionDto {
  @IsString()
  @MaxLength(500)
  question: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxResults?: number = 10;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6) // First exchange (topic anchor) + last 5 exchanges (recent context)
  @ValidateNested({ each: true })
  @Type(() => QAHistoryItemDto)
  history?: QAHistoryItemDto[];
}

export class FindConversationsDto {
  @IsString()
  @MaxLength(500)
  query: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxResults?: number = 10;
}
