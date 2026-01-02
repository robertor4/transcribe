import { Module } from '@nestjs/common';
import { ImportedConversationController } from './imported-conversation.controller';
import { ImportedConversationService } from './imported-conversation.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [ImportedConversationController],
  providers: [ImportedConversationService],
  exports: [ImportedConversationService],
})
export class ImportedConversationModule {}
