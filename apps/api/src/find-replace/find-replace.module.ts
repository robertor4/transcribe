import { Module } from '@nestjs/common';
import { FindReplaceController } from './find-replace.controller';
import { FindReplaceService } from './find-replace.service';
import { TranscriptionRepository } from '../firebase/repositories/transcription.repository';
import { AnalysisRepository } from '../firebase/repositories/analysis.repository';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [FindReplaceController],
  providers: [FindReplaceService, TranscriptionRepository, AnalysisRepository],
  exports: [FindReplaceService],
})
export class FindReplaceModule {}
