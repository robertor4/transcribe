// Safe migration script to add subscriptionTier to all users
// IMPORTANT: This script is BACKWARD COMPATIBLE and NON-DESTRUCTIVE
// - Only ADDS new fields, never removes old ones
// - Production (old code) will continue working with subscription.type
// - Development (new code) will use subscriptionTier

const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();

// Map old subscription types to new tiers
function mapOldTypeToNewTier(oldType) {
  const mapping = {
    'free': 'free',
    'pro': 'professional',
    'enterprise': 'professional', // Map enterprise to professional for now
  };
  return mapping[oldType] || 'free';
}

async function migrateUsersToSubscriptionTiers(dryRun = true) {
  try {
    console.log('='.repeat(70));
    console.log(`SUBSCRIPTION TIER MIGRATION - ${dryRun ? 'DRY RUN' : 'LIVE RUN'}`);
    console.log('='.repeat(70));
    console.log('This script will:');
    console.log('✓ Add subscriptionTier field to users (if missing)');
    console.log('✓ Add usageThisMonth tracking object (if missing)');
    console.log('✓ Preserve ALL existing fields (backward compatible)');
    console.log('✓ Map old subscription.type to new subscriptionTier');
    console.log('='.repeat(70));
    console.log('');

    // Get all users from Firestore
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    console.log(`Found ${users.length} users in Firestore\n`);

    let alreadyMigrated = 0;
    let willMigrate = 0;
    let errors = 0;
    const migrationPlan = [];

    // Analyze each user
    for (const user of users) {
      // Check if already has subscriptionTier
      if (user.subscriptionTier) {
        console.log(`✓ ${user.email} - Already has subscriptionTier: ${user.subscriptionTier}`);
        alreadyMigrated++;
        continue;
      }

      // Determine what tier to assign
      let newTier = 'free'; // Default
      let source = 'default';

      // Check if user has old subscription.type
      if (user.subscription && user.subscription.type) {
        newTier = mapOldTypeToNewTier(user.subscription.type);
        source = `mapped from subscription.type='${user.subscription.type}'`;
      }

      // Build update object
      const updates = {
        subscriptionTier: newTier,
      };

      // Add usageThisMonth if missing
      if (!user.usageThisMonth) {
        updates.usageThisMonth = {
          hours: 0,
          transcriptions: 0,
          onDemandAnalyses: 0,
          lastResetAt: new Date(),
        };
      }

      // Add updatedAt timestamp
      updates.updatedAt = new Date();

      migrationPlan.push({
        uid: user.uid,
        email: user.email,
        updates,
        source,
      });

      console.log(`→ ${user.email} - Will set subscriptionTier='${newTier}' (${source})`);
      willMigrate++;
    }

    console.log('\n' + '='.repeat(70));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total users: ${users.length}`);
    console.log(`Already migrated: ${alreadyMigrated}`);
    console.log(`Will migrate: ${willMigrate}`);
    console.log('='.repeat(70));

    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes made to Firestore');
      console.log('Run with --live flag to execute migration');
      console.log('\nExample: node scripts/migrate-to-subscription-tiers.js --live\n');
      process.exit(0);
    }

    // Execute migration (LIVE MODE)
    console.log('\n🚀 EXECUTING LIVE MIGRATION...\n');

    for (const plan of migrationPlan) {
      try {
        await db.collection('users').doc(plan.uid).update(plan.updates);
        console.log(`✅ Migrated ${plan.email} - subscriptionTier='${plan.updates.subscriptionTier}'`);
      } catch (error) {
        console.error(`❌ Error migrating ${plan.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('MIGRATION COMPLETED!');
    console.log('='.repeat(70));
    console.log(`Successfully migrated: ${willMigrate - errors}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

// Check for --live flag
const isLiveRun = process.argv.includes('--live');

migrateUsersToSubscriptionTiers(!isLiveRun);
