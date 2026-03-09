/**
 * Cleanup spam Firebase Auth accounts
 *
 * Identifies Firebase Auth accounts that:
 * 1. Have no corresponding Firestore user document (never used the app)
 * 2. Were created with email/password (not Google OAuth)
 * 3. Have NOT verified their email
 *
 * Usage:
 *   # Dry run (default) - shows what would be deleted
 *   node scripts/cleanup-spam-accounts.js
 *
 *   # Actually delete the spam accounts
 *   node scripts/cleanup-spam-accounts.js --delete
 *
 * Requires environment variables:
 *   FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
 */
const admin = require('firebase-admin');
const path = require('path');

// Load .env from project root
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const DRY_RUN = !process.argv.includes('--delete');

async function getAllAuthUsers() {
  const users = [];
  let nextPageToken;

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    users.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  return users;
}

async function cleanupSpamAccounts() {
  try {
    console.log(DRY_RUN
      ? '=== DRY RUN (pass --delete to actually remove accounts) ===\n'
      : '=== LIVE RUN - accounts will be DELETED ===\n'
    );

    // Get all Firebase Auth users
    const authUsers = await getAllAuthUsers();
    console.log(`Found ${authUsers.length} total Firebase Auth accounts`);

    // Get all Firestore user document IDs
    const firestoreSnapshot = await db.collection('users').select().get();
    const firestoreUserIds = new Set(firestoreSnapshot.docs.map(doc => doc.id));
    console.log(`Found ${firestoreUserIds.size} Firestore user documents\n`);

    const spamAccounts = [];
    const legitimateOrphans = [];

    for (const user of authUsers) {
      const hasFirestoreDoc = firestoreUserIds.has(user.uid);
      const isEmailPassword = user.providerData.some(p => p.providerId === 'password');
      const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
      const isVerified = user.emailVerified;

      if (!hasFirestoreDoc && isEmailPassword && !isGoogle && !isVerified) {
        // Spam: email/password, unverified, never used app
        spamAccounts.push(user);
      } else if (!hasFirestoreDoc) {
        // Orphaned but might be legitimate (Google, verified, etc.)
        legitimateOrphans.push(user);
      }
    }

    console.log(`Spam accounts (unverified email/password, no Firestore doc): ${spamAccounts.length}`);
    console.log(`Legitimate orphans (verified or Google, no Firestore doc): ${legitimateOrphans.length}\n`);

    if (spamAccounts.length > 0) {
      console.log('--- Spam accounts ---');
      for (const user of spamAccounts) {
        const created = new Date(user.metadata.creationTime).toISOString().split('T')[0];
        console.log(`  ${user.email || '(no email)'} | created: ${created} | uid: ${user.uid}`);
      }
      console.log('');
    }

    if (legitimateOrphans.length > 0) {
      console.log('--- Legitimate orphans (will NOT be deleted) ---');
      for (const user of legitimateOrphans) {
        const providers = user.providerData.map(p => p.providerId).join(', ');
        console.log(`  ${user.email || '(no email)'} | verified: ${user.emailVerified} | providers: ${providers}`);
      }
      console.log('');
    }

    if (!DRY_RUN && spamAccounts.length > 0) {
      console.log(`Deleting ${spamAccounts.length} spam accounts...`);

      // Delete in batches of 100
      const batchSize = 100;
      let deleted = 0;
      let errors = 0;

      for (let i = 0; i < spamAccounts.length; i += batchSize) {
        const batch = spamAccounts.slice(i, i + batchSize);
        const uids = batch.map(u => u.uid);

        try {
          const result = await auth.deleteUsers(uids);
          deleted += result.successCount;
          errors += result.failureCount;

          if (result.failureCount > 0) {
            for (const err of result.errors) {
              console.error(`  Failed to delete ${uids[err.index]}: ${err.error.message}`);
            }
          }
        } catch (error) {
          console.error(`  Batch delete failed: ${error.message}`);
          errors += batch.length;
        }

        // Progress update
        console.log(`  Progress: ${Math.min(i + batchSize, spamAccounts.length)}/${spamAccounts.length}`);
      }

      console.log(`\nDone! Deleted: ${deleted}, Errors: ${errors}`);
    } else if (DRY_RUN && spamAccounts.length > 0) {
      console.log(`Would delete ${spamAccounts.length} spam accounts. Run with --delete to proceed.`);
    } else {
      console.log('No spam accounts found.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanupSpamAccounts().then(() => process.exit(0));
