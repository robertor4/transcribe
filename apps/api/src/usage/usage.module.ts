import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UsageService } from './usage.service';
import { UsageScheduler } from './usage.scheduler';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot(), FirebaseModule],
  providers: [UsageService, UsageScheduler],
  exports: [UsageService],
})
export class UsageModule {}
