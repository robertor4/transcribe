import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { EmailVerificationService } from './email-verification.service';
import { TurnstileService } from './turnstile.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [FirebaseModule, UserModule],
  controllers: [AuthController],
  providers: [EmailVerificationService, TurnstileService],
  exports: [EmailVerificationService, TurnstileService],
})
export class AuthModule {}
