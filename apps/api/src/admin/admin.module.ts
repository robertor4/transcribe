import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { UserModule } from '../user/user.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [FirebaseModule, UserModule, UsageModule],
  controllers: [AdminController],
})
export class AdminModule {}
