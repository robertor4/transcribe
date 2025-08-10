import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleSpeechService } from './google-speech.service';

@Module({
  imports: [ConfigModule],
  providers: [GoogleSpeechService],
  exports: [GoogleSpeechService],
})
export class GoogleSpeechModule {}