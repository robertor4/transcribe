import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from '@transcribe/shared';
import { QueueHealthService } from './queue-health.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    FirebaseModule,
    WebSocketModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.TRANSCRIPTION,
    }),
  ],
  providers: [QueueHealthService],
  exports: [QueueHealthService],
})
export class QueueModule {}
