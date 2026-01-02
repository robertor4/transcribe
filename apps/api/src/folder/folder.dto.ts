import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty({ message: 'Folder name is required' })
  @MaxLength(100, { message: 'Folder name cannot exceed 100 characters' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Color code cannot exceed 20 characters' })
  color?: string;
}

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Folder name cannot exceed 100 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Color code cannot exceed 20 characters' })
  color?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
