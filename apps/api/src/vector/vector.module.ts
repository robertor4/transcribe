import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorController } from './vector.controller';
import { VectorService } from './vector.service';
import { QdrantService } from './qdrant.service';
import { EmbeddingService } from './embedding.service';
import { ChunkingService } from './chunking.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [ConfigModule, FirebaseModule],
  controllers: [VectorController],
  providers: [VectorService, QdrantService, EmbeddingService, ChunkingService],
  exports: [VectorService, ChunkingService],
})
export class VectorModule {}
