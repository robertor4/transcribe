import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsEnum(['professional', 'business', 'enterprise'])
  tier: 'professional' | 'business' | 'enterprise';

  @IsEnum(['monthly', 'annual'])
  @IsOptional()
  billing?: 'monthly' | 'annual' = 'monthly';

  @IsUrl()
  @IsOptional()
  successUrl?: string;

  @IsUrl()
  @IsOptional()
  cancelUrl?: string;

  @IsString()
  @IsOptional()
  locale?: string; // For Stripe Checkout localization (en, nl, de, fr, es)

  @IsString()
  @IsOptional()
  currency?: string; // Customer's preferred currency (USD, EUR, GBP)
}
