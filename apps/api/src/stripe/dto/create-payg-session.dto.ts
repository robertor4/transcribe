import { IsEnum, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreatePaygSessionDto {
  @IsNumber()
  @Min(15)
  amount: number; // Amount in USD (min $15)

  @IsNumber()
  @Min(10)
  hours: number; // Hours of credit (min 10)

  @IsUrl()
  @IsOptional()
  successUrl?: string;

  @IsUrl()
  @IsOptional()
  cancelUrl?: string;

  @IsString()
  @IsOptional()
  locale?: string;

  @IsString()
  @IsOptional()
  currency?: string; // Customer's preferred currency
}
