import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000, { message: 'Page number cannot exceed 10000' })
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'Page size cannot exceed 100' })
  pageSize: number = 20;
}
