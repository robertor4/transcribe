import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { TranscriptionProcessor } from './transcription.processor';
import { AnalysisTemplateService } from './analysis-template.service';
import { OnDemandAnalysisService } from './on-demand-analysis.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { AssemblyAIModule } from '../assembly-ai/assembly-ai.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';
import { UsageModule } from '../usage/usage.module';
import { SubscriptionGuard } from '../guards/subscription.guard';
import { QUEUE_NAMES } from '@transcribe/shared';

@Module({
  imports: [
    ConfigModule,
    FirebaseModule,
    WebSocketModule,
    AssemblyAIModule,
    EmailModule,
    UserModule,
    UsageModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.TRANSCRIPTION,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.SUMMARY,
    }),
  ],
  controllers: [TranscriptionController],
  providers: [
    TranscriptionService,
    TranscriptionProcessor,
    AnalysisTemplateService,
    OnDemandAnalysisService,
    SubscriptionGuard,
  ],
  exports: [
    TranscriptionService,
    AnalysisTemplateService,
    OnDemandAnalysisService,
  ],
})
export class TranscriptionModule {}
