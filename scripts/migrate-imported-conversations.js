#!/usr/bin/env node

/**
 * Migration script: Convert imported conversations to library copies.
 *
 * This script reads all documents from the `importedConversations` Firestore collection
 * and creates real `Transcription` documents in each user's library, copying the shared
 * content (transcript, summary, analyses, AI assets) into a standalone conversation.
 *
 * Usage:
 *   node scripts/migrate-imported-conversations.js [--dry-run]
 *
 * Options:
 *   --dry-run   Preview what would be migrated without writing anything
 *
 * Prerequisites:
 *   - .env file with FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
 *   - The copiedFrom* fields must exist in the Transcription type (deployed with Phase 1)
 */

const admin = require('firebase-admin');
require('dotenv').config();

const DRY_RUN = process.argv.includes('--dry-run');

// Validate environment variables
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  console.error(`  ${missingVars.join(', ')}`);
  console.error('\nPlease ensure these are set in your .env file');
  process.exit(1);
}

// Initialize Firebase Admin
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Counters
let total = 0;
let migrated = 0;
let skippedAlreadyMigrated = 0;
let skippedAlreadyCopied = 0;
let skippedUnavailable = 0;
let skippedDeleted = 0;
let errors = 0;

async function migrate() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Migrate Imported Conversations to Library Copies`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`${'='.repeat(60)}\n`);

  // 1. Fetch all imported conversations
  const snapshot = await db.collection('importedConversations').get();
  total = snapshot.size;
  console.log(`Found ${total} imported conversation(s) to process.\n`);

  if (total === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  for (const doc of snapshot.docs) {
    const imported = doc.data();
    const importId = doc.id;
    const userId = imported.userId;
    const shareToken = imported.shareToken;
    const originalId = imported.originalTranscriptionId;

    try {
      // Skip soft-deleted imports
      if (imported.deletedAt) {
        skippedDeleted++;
        console.log(`  [SKIP] ${importId} - soft-deleted`);
        continue;
      }

      // Skip already migrated
      if (imported.migratedAt) {
        skippedAlreadyMigrated++;
        console.log(`  [SKIP] ${importId} - already migrated to ${imported.migratedToTranscriptionId}`);
        continue;
      }

      // Check if user already has a copy (dedup)
      const existingCopy = await db
        .collection('transcriptions')
        .where('userId', '==', userId)
        .where('copiedFromTranscriptionId', '==', originalId)
        .limit(1)
        .get();

      if (!existingCopy.empty) {
        skippedAlreadyCopied++;
        console.log(`  [SKIP] ${importId} - user already has copy ${existingCopy.docs[0].id}`);

        // Mark as migrated even if already copied
        if (!DRY_RUN) {
          await doc.ref.update({
            migratedAt: new Date(),
            migratedToTranscriptionId: existingCopy.docs[0].id,
          });
        }
        continue;
      }

      // Fetch the original transcription
      const originalDoc = await db.collection('transcriptions').doc(originalId).get();
      if (!originalDoc.exists) {
        skippedUnavailable++;
        console.log(`  [SKIP] ${importId} - original transcription ${originalId} not found`);
        continue;
      }

      const original = originalDoc.data();

      // Check if share is still enabled (optional — we copy regardless since user already imported)
      const shareSettings = original.shareSettings;
      const contentOptions = shareSettings?.contentOptions || {
        includeTranscript: true,
        includeSummary: true,
        includeCommunicationStyles: true,
        includeActionItems: true,
        includeSpeakerInfo: true,
        includeOnDemandAnalyses: false,
        selectedAnalysisIds: [],
      };

      // Build new transcription document
      const now = new Date();
      const importedAt = imported.importedAt?.toDate ? imported.importedAt.toDate() : imported.importedAt || now;

      const newTranscription = {
        userId,
        fileName: original.fileName || 'Imported conversation',
        title: imported.title || original.title || original.fileName || 'Imported conversation',
        status: 'completed',
        fileSize: 0,
        mimeType: original.mimeType || 'audio/mpeg',
        duration: original.duration || 0,
        createdAt: importedAt,
        updatedAt: now,
        completedAt: now,

        // Provenance
        copiedFromTranscriptionId: originalId,
        copiedFromShareToken: shareToken,
        copiedFromSharedBy: imported.sharedByName || 'Unknown',
        copiedAt: importedAt,
      };

      // Copy content based on contentOptions
      if (contentOptions.includeTranscript && original.transcriptText) {
        newTranscription.transcriptText = original.transcriptText;
      }
      if (contentOptions.includeSummary) {
        if (original.summaryV2) {
          newTranscription.summaryV2 = original.summaryV2;
        }
        if (original.coreAnalyses?.summaryV2) {
          newTranscription.coreAnalyses = newTranscription.coreAnalyses || {};
          newTranscription.coreAnalyses.summaryV2 = original.coreAnalyses.summaryV2;
        }
        if (original.coreAnalyses?.summary) {
          newTranscription.coreAnalyses = newTranscription.coreAnalyses || {};
          newTranscription.coreAnalyses.summary = original.coreAnalyses.summary;
        }
      }
      if (contentOptions.includeActionItems && original.coreAnalyses?.actionItems) {
        newTranscription.coreAnalyses = newTranscription.coreAnalyses || {};
        newTranscription.coreAnalyses.actionItems = original.coreAnalyses.actionItems;
      }
      if (contentOptions.includeCommunicationStyles && original.coreAnalyses?.communicationStyles) {
        newTranscription.coreAnalyses = newTranscription.coreAnalyses || {};
        newTranscription.coreAnalyses.communicationStyles = original.coreAnalyses.communicationStyles;
      }
      if (contentOptions.includeSpeakerInfo) {
        if (original.speakerSegments) newTranscription.speakerSegments = original.speakerSegments;
        if (original.speakers) newTranscription.speakers = original.speakers;
        if (original.speakerCount) newTranscription.speakerCount = original.speakerCount;
      }
      if (original.conversationCategory) {
        newTranscription.conversationCategory = original.conversationCategory;
      }
      if (original.translations) {
        newTranscription.translations = original.translations;
      }
      if (original.preferredTranslationLanguage) {
        newTranscription.preferredTranslationLanguage = original.preferredTranslationLanguage;
      }

      if (DRY_RUN) {
        console.log(`  [DRY] Would create transcription for user ${userId} from original ${originalId}`);
        migrated++;
        continue;
      }

      // Create the new transcription
      const newDocRef = await db.collection('transcriptions').add(newTranscription);
      const newId = newDocRef.id;

      // Copy AI Assets if allowed
      if (contentOptions.includeOnDemandAnalyses) {
        const analysesSnapshot = await db
          .collection('generatedAnalyses')
          .where('transcriptionId', '==', originalId)
          .where('userId', '==', original.userId)
          .get();

        let analysesCopied = 0;
        const selectedIds = contentOptions.selectedAnalysisIds || [];

        for (const analysisDoc of analysesSnapshot.docs) {
          const analysis = analysisDoc.data();

          // Filter by selected IDs if specified
          if (selectedIds.length > 0 && !selectedIds.includes(analysisDoc.id)) {
            continue;
          }

          const analysisCopy = { ...analysis };
          delete analysisCopy.id;
          analysisCopy.transcriptionId = newId;
          analysisCopy.userId = userId;
          analysisCopy.createdAt = analysis.createdAt || now;

          await db.collection('generatedAnalyses').add(analysisCopy);
          analysesCopied++;
        }

        if (analysesCopied > 0) {
          // Update generatedAnalysisIds on the new transcription
          const idsSnapshot = await db
            .collection('generatedAnalyses')
            .where('transcriptionId', '==', newId)
            .where('userId', '==', userId)
            .select()
            .get();
          const ids = idsSnapshot.docs.map(d => d.id);
          await newDocRef.update({ generatedAnalysisIds: ids });
        }
      }

      // Mark old import as migrated
      await doc.ref.update({
        migratedAt: now,
        migratedToTranscriptionId: newId,
      });

      migrated++;
      console.log(`  [OK] ${importId} -> ${newId} (user: ${userId})`);
    } catch (err) {
      errors++;
      console.error(`  [ERROR] ${importId}: ${err.message}`);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('  Migration Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total processed:        ${total}`);
  console.log(`  Migrated:               ${migrated}`);
  console.log(`  Skipped (soft-deleted):  ${skippedDeleted}`);
  console.log(`  Skipped (already migr):  ${skippedAlreadyMigrated}`);
  console.log(`  Skipped (already copy):  ${skippedAlreadyCopied}`);
  console.log(`  Skipped (unavailable):   ${skippedUnavailable}`);
  console.log(`  Errors:                  ${errors}`);
  console.log(`${'='.repeat(60)}\n`);
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
