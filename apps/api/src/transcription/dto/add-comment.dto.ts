import { IsString, IsNotEmpty, MaxLength, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CommentPositionDto {
  @IsNumber()
  start: number;

  @IsNumber()
  end: number;
}

export class AddCommentDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CommentPositionDto)
  position: CommentPositionDto;

  @IsString()
  @IsNotEmpty({ message: 'Comment content cannot be empty' })
  @MaxLength(5000, { message: 'Comment cannot exceed 5000 characters' })
  content: string;
}

export class UpdateCommentDto {
  @IsString()
  @MaxLength(5000)
  content?: string;

  @Type(() => Boolean)
  resolved?: boolean;
}
