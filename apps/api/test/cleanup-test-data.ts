/**
 * Cleanup script for orphaned test data
 *
 * Run this script to clean up test users and data that weren't deleted
 * due to interrupted test runs.
 *
 * Usage:
 *   npx ts-node test/cleanup-test-data.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (
    !privateKey ||
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    console.error('❌ Missing Firebase credentials in environment variables');
    console.error(
      'Required: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL',
    );
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  console.log('✅ Firebase initialized\n');
}

async function cleanupTestData() {
  console.log('🧹 Starting test data cleanup...\n');

  let deletedUsers = 0;
  let deletedTranscriptions = 0;
  let deletedAnalyses = 0;

  try {
    // List all users
    const listUsersResult = await admin.auth().listUsers();

    for (const user of listUsersResult.users) {
      // Check if this is a test user (starts with test-translation-)
      if (user.email && user.email.startsWith('test-translation-')) {
        console.log(`Found test user: ${user.email} (${user.uid})`);

        try {
          // Delete user's transcriptions
          const transcriptionsSnapshot = await admin
            .firestore()
            .collection('transcriptions')
            .where('userId', '==', user.uid)
            .get();

          for (const doc of transcriptionsSnapshot.docs) {
            await doc.ref.delete();
            deletedTranscriptions++;
            console.log(`  ✓ Deleted transcription: ${doc.id}`);
          }

          // Delete user's generated analyses
          const analysesSnapshot = await admin
            .firestore()
            .collection('generatedAnalyses')
            .where('userId', '==', user.uid)
            .get();

          for (const doc of analysesSnapshot.docs) {
            await doc.ref.delete();
            deletedAnalyses++;
            console.log(`  ✓ Deleted analysis: ${doc.id}`);
          }

          // Delete user document
          await admin.firestore().collection('users').doc(user.uid).delete();
          console.log(`  ✓ Deleted user document from Firestore`);

          // Delete user from Auth
          await admin.auth().deleteUser(user.uid);
          deletedUsers++;
          console.log(`  ✓ Deleted user from Auth: ${user.uid}\n`);
        } catch (error) {
          console.error(`  ✗ Error cleaning up user ${user.email}:`, error);
        }
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`  Users deleted: ${deletedUsers}`);
    console.log(`  Transcriptions deleted: ${deletedTranscriptions}`);
    console.log(`  Analyses deleted: ${deletedAnalyses}`);

    if (deletedUsers === 0) {
      console.log('\n✨ No test data found - everything is clean!');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run cleanup
void cleanupTestData();
