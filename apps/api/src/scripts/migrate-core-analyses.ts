/**
 * Migration Script: Migrate coreAnalyses to summaryV2 on transcription docs
 *
 * This script:
 * 1. Finds all transcriptions with coreAnalyses field
 * 2. Promotes summaryV2 from coreAnalyses to root level on transcription doc
 * 3. Removes the coreAnalyses field
 *
 * Old actionItems and communicationStyles (markdown) are discarded.
 * Users can regenerate them using V2 templates from the generatedAnalyses system.
 *
 * Run this script ~1 week after V2 release when the new architecture is proven stable.
 *
 * Usage:
 *   cd apps/api
 *   npx ts-node src/scripts/migrate-core-analyses.ts
 *
 * Options:
 *   --dry-run    Preview changes without making them
 *   --limit=N    Process only N transcriptions
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../..', '.env') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const db = admin.firestore();

interface MigrationStats {
  total: number;
  migrated: number;
  alreadyMigrated: number;
  errors: number;
  skipped: number;
}

interface MigrationOptions {
  dryRun: boolean;
  limit?: number;
}

async function migrateTranscription(
  doc: admin.firestore.DocumentSnapshot,
  options: MigrationOptions,
  stats: MigrationStats,
): Promise<void> {
  const data = doc.data();
  if (!data) {
    stats.skipped++;
    return;
  }

  const transcriptionId = doc.id;

  // Check if already has summaryV2 at root (already migrated)
  if (data.summaryV2 && !data.coreAnalyses) {
    console.log(`  [SKIP] ${transcriptionId} - Already migrated`);
    stats.alreadyMigrated++;
    return;
  }

  // Check if has coreAnalyses to migrate
  if (!data.coreAnalyses) {
    console.log(`  [SKIP] ${transcriptionId} - No coreAnalyses field`);
    stats.skipped++;
    return;
  }

  const updates: admin.firestore.UpdateData<admin.firestore.DocumentData> = {};

  // 1. Promote summaryV2 to top-level if it exists in coreAnalyses
  if (data.coreAnalyses.summaryV2) {
    updates.summaryV2 = data.coreAnalyses.summaryV2;
    console.log(`  [MIGRATE] ${transcriptionId} - Promoting summaryV2 to root level`);
  } else {
    console.log(`  [WARN] ${transcriptionId} - No summaryV2 in coreAnalyses, only removing field`);
  }

  // 2. Delete the coreAnalyses field
  updates.coreAnalyses = admin.firestore.FieldValue.delete();

  // Log what would be discarded
  if (data.coreAnalyses.actionItems) {
    console.log(`    - Discarding actionItems (${data.coreAnalyses.actionItems.length} chars)`);
  }
  if (data.coreAnalyses.communicationStyles) {
    console.log(`    - Discarding communicationStyles (${data.coreAnalyses.communicationStyles.length} chars)`);
  }

  if (options.dryRun) {
    console.log(`  [DRY-RUN] Would update ${transcriptionId}`);
    stats.migrated++;
    return;
  }

  try {
    await db.collection('transcriptions').doc(transcriptionId).update(updates);
    stats.migrated++;
    console.log(`  [OK] ${transcriptionId} migrated successfully`);
  } catch (error) {
    console.error(`  [ERROR] ${transcriptionId}:`, error);
    stats.errors++;
  }
}

async function runMigration(options: MigrationOptions): Promise<void> {
  console.log('='.repeat(60));
  console.log('Migration: coreAnalyses → summaryV2 (V2 Architecture)');
  console.log('='.repeat(60));
  console.log(`Mode: ${options.dryRun ? 'DRY-RUN (no changes)' : 'LIVE (making changes)'}`);
  if (options.limit) {
    console.log(`Limit: ${options.limit} transcriptions`);
  }
  console.log('');

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    alreadyMigrated: 0,
    errors: 0,
    skipped: 0,
  };

  const batchSize = 100;
  let lastDoc: admin.firestore.DocumentSnapshot | null = null;
  let processed = 0;

  while (true) {
    // Query transcriptions with coreAnalyses field
    let query = db.collection('transcriptions')
      .orderBy('createdAt', 'desc')
      .limit(batchSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log('\nNo more transcriptions to process.');
      break;
    }

    console.log(`\nProcessing batch of ${snapshot.size} transcriptions...`);

    for (const doc of snapshot.docs) {
      stats.total++;
      await migrateTranscription(doc, options, stats);

      processed++;
      if (options.limit && processed >= options.limit) {
        console.log(`\nReached limit of ${options.limit} transcriptions.`);
        break;
      }
    }

    if (options.limit && processed >= options.limit) {
      break;
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total processed:    ${stats.total}`);
  console.log(`Migrated:           ${stats.migrated}`);
  console.log(`Already migrated:   ${stats.alreadyMigrated}`);
  console.log(`Skipped:            ${stats.skipped}`);
  console.log(`Errors:             ${stats.errors}`);
  console.log('='.repeat(60));

  if (options.dryRun) {
    console.log('\n⚠️  DRY-RUN mode - no changes were made.');
    console.log('Run without --dry-run to apply changes.');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: MigrationOptions = {
  dryRun: args.includes('--dry-run'),
  limit: undefined,
};

const limitArg = args.find(arg => arg.startsWith('--limit='));
if (limitArg) {
  options.limit = parseInt(limitArg.split('=')[1], 10);
}

// Run migration
runMigration(options)
  .then(() => {
    console.log('\nMigration complete.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });
