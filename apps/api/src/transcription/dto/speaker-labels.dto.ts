import {
  IsArray,
  IsNumber,
  IsString,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SpeakerLabelDto {
  @IsNumber()
  speakerId: number;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Speaker name cannot exceed 50 characters' })
  customName?: string;
}

export class UpdateSpeakerLabelsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpeakerLabelDto)
  speakers: SpeakerLabelDto[];
}
