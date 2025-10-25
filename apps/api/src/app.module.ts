import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { WebSocketModule } from './websocket/websocket.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: {
          age: parseInt(process.env.QUEUE_COMPLETED_JOB_AGE || '86400'), // 24 hours default
          count: parseInt(process.env.QUEUE_COMPLETED_JOB_COUNT || '1000'), // 1000 jobs default
        },
        removeOnFail: {
          age: parseInt(process.env.QUEUE_FAILED_JOB_AGE || '604800'), // 7 days default
          count: parseInt(process.env.QUEUE_FAILED_JOB_COUNT || '5000'), // 5000 jobs default
        },
      },
    }),
    FirebaseModule,
    WebSocketModule,
    QueueModule,
    TranscriptionModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
