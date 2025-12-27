import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';

export class FindDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  findText: string;

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean = false;

  @IsOptional()
  @IsBoolean()
  wholeWord?: boolean = false;
}
