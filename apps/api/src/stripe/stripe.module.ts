import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [ConfigModule, FirebaseModule, AnalyticsModule],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
