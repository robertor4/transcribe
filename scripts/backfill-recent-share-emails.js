#!/usr/bin/env node

/**
 * Backfill script: Populate recentShareEmails on user documents.
 *
 * Scans all transcriptions with `sharedWith` entries, aggregates emails
 * per user (deduplicated, most recent first), and writes the top 20
 * to each user's `recentShareEmails` field.
 *
 * Usage:
 *   node scripts/backfill-recent-share-emails.js [--dry-run]
 *
 * Options:
 *   --dry-run   Preview what would be written without modifying any data
 *
 * Prerequisites:
 *   - .env file with FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
 */

const admin = require('firebase-admin');
require('dotenv').config();

const DRY_RUN = process.argv.includes('--dry-run');
const MAX_RECENT_EMAILS = 20;

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

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Backfill recentShareEmails${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log(`${'='.repeat(60)}\n`);

  // Step 1: Query all transcriptions that have sharedWith entries
  console.log('Scanning transcriptions with sharedWith data...\n');

  const snapshot = await db.collection('transcriptions')
    .where('sharedWith', '!=', null)
    .get();

  console.log(`Found ${snapshot.size} transcriptions with sharedWith data.\n`);

  if (snapshot.empty) {
    console.log('Nothing to do.');
    return;
  }

  // Step 2: Aggregate emails per userId
  // Map<userId, Map<emailLower, { email: string, lastUsed: Date }>>
  const userEmailsMap = new Map();

  let transcriptionsProcessed = 0;
  let totalEmailRecords = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const userId = data.userId;
    const sharedWith = data.sharedWith;

    if (!userId || !Array.isArray(sharedWith) || sharedWith.length === 0) {
      return;
    }

    if (!userEmailsMap.has(userId)) {
      userEmailsMap.set(userId, new Map());
    }

    const emailMap = userEmailsMap.get(userId);

    for (const record of sharedWith) {
      if (!record.email) continue;

      const emailLower = record.email.toLowerCase();
      let sentAt;

      // Handle Firestore Timestamp
      if (record.sentAt && typeof record.sentAt.toDate === 'function') {
        sentAt = record.sentAt.toDate();
      } else if (record.sentAt && record.sentAt.seconds) {
        sentAt = new Date(record.sentAt.seconds * 1000);
      } else if (record.sentAt) {
        sentAt = new Date(record.sentAt);
      } else {
        sentAt = new Date(0); // Unknown date, will sort to end
      }

      // Keep the most recent sentAt per email
      const existing = emailMap.get(emailLower);
      if (!existing || sentAt > existing.lastUsed) {
        emailMap.set(emailLower, {
          email: record.email,
          lastUsed: sentAt,
        });
      }

      totalEmailRecords++;
    }

    transcriptionsProcessed++;
  });

  console.log(`Processed ${transcriptionsProcessed} transcriptions, ${totalEmailRecords} email records.`);
  console.log(`Found ${userEmailsMap.size} users with shared emails.\n`);

  // Step 3: Write to each user's document
  let usersUpdated = 0;
  let usersSkipped = 0;

  for (const [userId, emailMap] of userEmailsMap) {
    // Sort by most recent first, take top 20
    const recentShareEmails = Array.from(emailMap.values())
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
      .slice(0, MAX_RECENT_EMAILS);

    const emailList = recentShareEmails.map(e => e.email).join(', ');

    if (DRY_RUN) {
      console.log(`  [DRY RUN] User ${userId}: would write ${recentShareEmails.length} emails`);
      console.log(`            ${emailList}`);
      usersUpdated++;
    } else {
      try {
        // Check if user document exists
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          console.log(`  SKIP User ${userId}: user document not found`);
          usersSkipped++;
          continue;
        }

        await db.collection('users').doc(userId).update({
          recentShareEmails,
          updatedAt: new Date(),
        });

        console.log(`  Updated user ${userId}: ${recentShareEmails.length} emails (${emailList})`);
        usersUpdated++;
      } catch (error) {
        console.error(`  ERROR updating user ${userId}:`, error.message);
        usersSkipped++;
      }
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Summary${DRY_RUN ? ' (DRY RUN - no changes made)' : ''}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Transcriptions scanned:  ${transcriptionsProcessed}`);
  console.log(`  Email records found:     ${totalEmailRecords}`);
  console.log(`  Users updated:           ${usersUpdated}`);
  console.log(`  Users skipped:           ${usersSkipped}`);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
