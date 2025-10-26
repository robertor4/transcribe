import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaygSessionDto {
  @IsNumber()
  @Min(15)
  amount: number; // Amount in USD (min $15)

  @IsNumber()
  @Min(10)
  hours: number; // Hours of credit (min 10)

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;

  @IsString()
  @IsOptional()
  locale?: string;

  @IsString()
  @IsOptional()
  currency?: string; // Customer's preferred currency
}
