import { Module } from '@nestjs/common';
import { FolderController } from './folder.controller';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [FolderController],
  exports: [],
})
export class FolderModule {}
