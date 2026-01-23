import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

/**
 * DTO for processing a file that was uploaded directly to Firebase Storage.
 * Used when the browser uploads directly to storage and then notifies backend.
 */
export class ProcessFromStorageDto {
  @IsString()
  storagePath: string;

  @IsString()
  fileName: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  contentType: string;

  @IsString()
  @IsOptional()
  analysisType?: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsString()
  @IsOptional()
  contextId?: string;

  @IsArray()
  @IsOptional()
  selectedTemplates?: string[];
}
