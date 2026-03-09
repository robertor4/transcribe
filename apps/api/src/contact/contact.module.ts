import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { EmailModule } from '../email/email.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EmailModule, FirebaseModule, AuthModule],
  controllers: [ContactController],
})
export class ContactModule {}
