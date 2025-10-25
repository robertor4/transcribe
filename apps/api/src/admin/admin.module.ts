import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [FirebaseModule, UserModule],
  controllers: [AdminController],
})
export class AdminModule {}
