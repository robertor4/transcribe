import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { EmailModule } from '../email/email.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [EmailModule, FirebaseModule],
  controllers: [ContactController],
})
export class ContactModule {}
