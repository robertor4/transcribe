import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsageModule } from '../usage/usage.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [FirebaseModule, UsageModule, StripeModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
