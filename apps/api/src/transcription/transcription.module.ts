import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { TranscriptionProcessor } from './transcription.processor';
import { FirebaseModule } from '../firebase/firebase.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { AssemblyAIModule } from '../assembly-ai/assembly-ai.module';
import { GoogleSpeechModule } from '../google-speech/google-speech.module';
import { QUEUE_NAMES } from '@transcribe/shared';

@Module({
  imports: [
    ConfigModule,
    FirebaseModule,
    WebSocketModule,
    AssemblyAIModule,
    GoogleSpeechModule, // Keep for now as fallback
    BullModule.registerQueue({
      name: QUEUE_NAMES.TRANSCRIPTION,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.SUMMARY,
    }),
  ],
  controllers: [TranscriptionController],
  providers: [TranscriptionService, TranscriptionProcessor],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
