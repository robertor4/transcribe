import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { EmailVerificationService } from './email-verification.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [FirebaseModule, UserModule],
  controllers: [AuthController],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
})
export class AuthModule {}