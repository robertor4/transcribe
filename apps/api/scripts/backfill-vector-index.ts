/**
 * One-time script to backfill existing conversations into the Qdrant vector index.
 *
 * This script:
 * 1. Queries all transcriptions that have NOT been indexed (vectorIndexedAt is null)
 * 2. Indexes each one using the VectorService
 * 3. Includes rate limiting to avoid API quota issues
 *
 * Usage:
 *   cd apps/api
 *   npx ts-node ../../scripts/backfill-vector-index.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { VectorService } from '../src/vector/vector.service';
import * as admin from 'firebase-admin';

interface TranscriptionDoc {
  id: string;
  userId: string;
  title: string;
  status: string;
  vectorIndexedAt?: Date;
  vectorIndexVersion?: number;
  speakerSegments?: unknown[];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting vector index backfill...\n');

  // Bootstrap NestJS app to get access to services
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const vectorService = app.get(VectorService);

  // Check if vector service is available
  if (!vectorService.isAvailable()) {
    console.error('❌ Vector service is not available. Check QDRANT_URL and QDRANT_API_KEY.');
    await app.close();
    process.exit(1);
  }

  // Get Firestore from the initialized Firebase app
  const db = admin.firestore();

  // Query all completed transcriptions that haven't been indexed
  console.log('📊 Querying unindexed transcriptions...');

  const snapshot = await db
    .collection('transcriptions')
    .where('status', '==', 'completed')
    .get();

  const allDocs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as TranscriptionDoc[];

  // Filter to conversations with speaker segments
  // Re-index ALL to add metadata chunks (vectorIndexVersion < 2)
  const needsReindex = allDocs.filter(
    (doc) =>
      doc.speakerSegments &&
      doc.speakerSegments.length > 0 &&
      (!doc.vectorIndexVersion || doc.vectorIndexVersion < 2)
  );

  console.log(`📋 Found ${allDocs.length} completed transcriptions`);
  console.log(`📋 ${needsReindex.length} need (re)indexing for metadata chunks\n`);

  if (needsReindex.length === 0) {
    console.log('✅ All transcriptions already have metadata chunks!');
    await app.close();
    return;
  }

  // Process each transcription
  let indexed = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < needsReindex.length; i++) {
    const doc = needsReindex[i];
    const progress = `[${i + 1}/${needsReindex.length}]`;

    try {
      console.log(`${progress} Indexing "${doc.title || doc.id}"...`);

      const chunkCount = await vectorService.indexTranscription(doc.userId, doc.id);

      if (chunkCount > 0) {
        console.log(`${progress} ✅ Indexed ${chunkCount} chunks`);
        indexed++;
      } else {
        console.log(`${progress} ⚠️ Skipped (no chunks generated)`);
        skipped++;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log(`${progress} ❌ Failed: ${message}`);
      failed++;
    }

    // Rate limiting: wait 500ms between requests to avoid OpenAI rate limits
    if (i < needsReindex.length - 1) {
      await sleep(500);
    }
  }

  console.log('\n📊 Backfill complete!');
  console.log(`   ✅ Indexed: ${indexed}`);
  console.log(`   ⚠️ Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);

  await app.close();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
