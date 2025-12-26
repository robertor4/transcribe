import { Module, forwardRef } from '@nestjs/common';
import { FolderController } from './folder.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [FirebaseModule, forwardRef(() => VectorModule)],
  controllers: [FolderController],
  exports: [],
})
export class FolderModule {}
