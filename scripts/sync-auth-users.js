// Script to sync Firebase Auth users to Firestore users collection
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
const auth = admin.auth();

async function syncAuthUsersToFirestore() {
  try {
    console.log('Starting sync of Firebase Auth users to Firestore...\n');

    // Get all users from Firebase Auth
    const listUsersResult = await auth.listUsers();
    const authUsers = listUsersResult.users;

    console.log(`Found ${authUsers.length} users in Firebase Auth`);

    // Get all existing user documents from Firestore
    const firestoreSnapshot = await db.collection('users').get();
    const firestoreUserIds = new Set(firestoreSnapshot.docs.map(doc => doc.id));

    console.log(`Found ${firestoreUserIds.size} users in Firestore\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    // Sync each auth user to Firestore
    for (const authUser of authUsers) {
      if (firestoreUserIds.has(authUser.uid)) {
        console.log(`✓ Skipped ${authUser.email} (already exists in Firestore)`);
        skipped++;
        continue;
      }

      try {
        // Create user document in Firestore
        const userData = {
          email: authUser.email || '',
          emailVerified: authUser.emailVerified || false,
          displayName: authUser.displayName || undefined,
          photoURL: authUser.photoURL || undefined,
          role: 'user', // Default role
          subscriptionTier: 'free', // Default to free tier
          usageThisMonth: {
            hours: 0,
            transcriptions: 0,
            onDemandAnalyses: 0,
            lastResetAt: new Date(),
          },
          createdAt: new Date(authUser.metadata.creationTime),
          updatedAt: new Date(),
        };

        // Filter out undefined values
        const filteredUserData = Object.entries(userData).reduce(
          (acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );

        await db.collection('users').doc(authUser.uid).set(filteredUserData);

        console.log(`✅ Created ${authUser.email} in Firestore`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating ${authUser.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Sync completed!');
    console.log('='.repeat(60));
    console.log(`Total Auth users: ${authUsers.length}`);
    console.log(`Already in Firestore: ${skipped}`);
    console.log(`Newly created: ${created}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('Fatal error during sync:', error);
    process.exit(1);
  }
}

syncAuthUsersToFirestore();
