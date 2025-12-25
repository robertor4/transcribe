import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { WebSocketModule } from './websocket/websocket.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { StripeModule } from './stripe/stripe.module';
import { UsageModule } from './usage/usage.module';
import { AdminModule } from './admin/admin.module';
import { QueueModule } from './queue/queue.module';
import { FolderModule } from './folder/folder.module';
import { TranslationModule } from './translation/translation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    // Enable scheduled tasks (cron jobs)
    ScheduleModule.forRoot(),
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second (global)
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
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
    StripeModule,
    UsageModule,
    AdminModule,
    FolderModule,
    TranslationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
