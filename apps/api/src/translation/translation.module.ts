import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [ConfigModule, FirebaseModule],
  controllers: [TranslationController],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
