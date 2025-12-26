import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import { StorageService } from './services/storage.service';
import { UserRepository } from './repositories/user.repository';
import { AnalysisRepository } from './repositories/analysis.repository';
import { FolderRepository } from './repositories/folder.repository';
import { CommentRepository } from './repositories/comment.repository';
import { TranslationRepository } from './repositories/translation.repository';
import { TranscriptionRepository } from './repositories/transcription.repository';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    FirebaseService,
    StorageService,
    UserRepository,
    AnalysisRepository,
    FolderRepository,
    CommentRepository,
    TranslationRepository,
    TranscriptionRepository,
  ],
  exports: [
    FirebaseService,
    StorageService,
    UserRepository,
    AnalysisRepository,
    FolderRepository,
    CommentRepository,
    TranslationRepository,
    TranscriptionRepository,
  ],
})
export class FirebaseModule {}
