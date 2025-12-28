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
import { ImportedConversationRepository } from './repositories/imported-conversation.repository';

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
    ImportedConversationRepository,
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
    ImportedConversationRepository,
  ],
})
export class FirebaseModule {}
