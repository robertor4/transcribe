import { IsEnum, IsOptional } from 'class-validator';

export class UpdateSubscriptionDto {
  @IsEnum(['professional', 'business', 'enterprise'])
  @IsOptional()
  newTier?: 'professional' | 'business' | 'enterprise';

  @IsEnum(['monthly', 'annual'])
  @IsOptional()
  newBilling?: 'monthly' | 'annual';
}
