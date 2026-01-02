/**
 * Cleanup script to delete all legacy 'email' type analyses from Firebase
 *
 * Run with: node scripts/cleanup-email-analyses.js
 *
 * Requires environment variables:
 *   - FIREBASE_PROJECT_ID
 *   - FIREBASE_CLIENT_EMAIL
 *   - FIREBASE_PRIVATE_KEY
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables from root .env
dotenv.config();

console.log('Starting email analyses cleanup script...');

async function cleanupEmailAnalyses() {
  // Validate required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing required environment variables:');
    if (!projectId) console.error('  - FIREBASE_PROJECT_ID');
    if (!clientEmail) console.error('  - FIREBASE_CLIENT_EMAIL');
    if (!privateKey) console.error('  - FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  console.log('Firebase credentials found, initializing...');

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  const db = admin.firestore();

  console.log('Searching for email analyses to delete...\n');

  // Query all email analyses by templateId
  const snapshot = await db
    .collection('generatedAnalyses')
    .where('templateId', '==', 'email')
    .get();

  if (snapshot.empty) {
    console.log('No email analyses found. Nothing to clean up.');
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} email analyses to delete.\n`);

  // Show preview of what will be deleted
  console.log('Documents to delete:');
  snapshot.docs.slice(0, 5).forEach((doc) => {
    const data = doc.data();
    console.log(`  - ${doc.id} (transcription: ${data.transcriptionId})`);
  });
  if (snapshot.size > 5) {
    console.log(`  ... and ${snapshot.size - 5} more\n`);
  }

  // Confirm deletion
  console.log('\nProceeding with deletion...\n');

  let deletedCount = 0;
  const batchSize = 500; // Firestore batch limit
  let batch = db.batch();

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    deletedCount++;

    // Commit batch when reaching limit
    if (deletedCount % batchSize === 0) {
      await batch.commit();
      console.log(`Deleted ${deletedCount} documents...`);
      batch = db.batch(); // Create new batch
    }
  }

  // Commit remaining documents
  if (deletedCount % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`\nCleanup complete. Deleted ${deletedCount} email analyses.`);
  process.exit(0);
}

cleanupEmailAnalyses().catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
