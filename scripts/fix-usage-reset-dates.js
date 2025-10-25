/**
 * Migration Script: Fix Usage Reset Dates
 *
 * Purpose: Initialize lastResetAt for users who have invalid or missing dates
 *
 * This script fixes users whose usageThisMonth.lastResetAt is:
 * - Missing (undefined)
 * - Invalid (Unix epoch date like 1/1/1970)
 * - Before 2020 (considered invalid)
 *
 * Usage:
 *   node scripts/fix-usage-reset-dates.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  console.log('✓ Firebase Admin initialized successfully');
} catch (error) {
  console.error('✗ Error initializing Firebase Admin:', error.message);
  console.error('  Make sure environment variables are set in .env file');
  process.exit(1);
}

const db = admin.firestore();

async function fixUsageResetDates(dryRun = true) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Fix Usage Reset Dates - ${dryRun ? 'DRY RUN' : 'LIVE MODE'}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Fetch all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} total users\n`);

    let fixedCount = 0;
    let alreadyValidCount = 0;
    const cutoffDate = new Date('2020-01-01').getTime();

    for (const doc of usersSnapshot.docs) {
      const user = doc.data();
      const userId = doc.id;

      // Check if usageThisMonth exists
      if (!user.usageThisMonth) {
        console.log(`⚠️  User ${userId} (${user.email}) - No usageThisMonth field`);
        continue;
      }

      const lastResetAt = user.usageThisMonth.lastResetAt;

      // Check if lastResetAt is missing or invalid
      let needsFix = false;
      let reason = '';

      if (!lastResetAt) {
        needsFix = true;
        reason = 'Missing lastResetAt';
      } else {
        const resetTimestamp = lastResetAt.toDate ? lastResetAt.toDate().getTime() : lastResetAt.getTime();

        if (resetTimestamp < cutoffDate) {
          needsFix = true;
          reason = `Invalid date: ${new Date(resetTimestamp).toLocaleDateString()}`;
        }
      }

      if (needsFix) {
        console.log(`🔧 Fixing ${userId} (${user.email || 'no-email'})`);
        console.log(`   Reason: ${reason}`);

        if (!dryRun) {
          await db.collection('users').doc(userId).update({
            'usageThisMonth.lastResetAt': new Date(),
          });
          console.log(`   ✓ Updated to current date`);
        } else {
          console.log(`   → Would update to current date`);
        }

        fixedCount++;
      } else {
        alreadyValidCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total users:       ${usersSnapshot.size}`);
    console.log(`Already valid:     ${alreadyValidCount}`);
    console.log(`${dryRun ? 'Would fix' : 'Fixed'}:         ${fixedCount}`);
    console.log(`${'='.repeat(60)}\n`);

    if (dryRun && fixedCount > 0) {
      console.log('💡 This was a DRY RUN. No changes were made.');
      console.log('   To apply changes, edit the script and set dryRun = false\n');
    } else if (!dryRun && fixedCount > 0) {
      console.log('✓ Migration completed successfully!\n');
    } else {
      console.log('✓ All users already have valid reset dates!\n');
    }

  } catch (error) {
    console.error('\n✗ Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
// Set to false to actually apply changes
const DRY_RUN = false;

fixUsageResetDates(DRY_RUN)
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
