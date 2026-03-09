#!/usr/bin/env node

/**
 * Manual user upgrade script
 * Usage: node scripts/upgrade-user.js <email>
 *
 * Upgrades a user to Professional tier in Firestore.
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
 */

const admin = require('firebase-admin');
const path = require('path');

// Load .env from project root
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/upgrade-user.js <email>');
  process.exit(1);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function upgradeUser(email) {
  // 1. Find user in Firebase Auth by email
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (err) {
    console.error(`User not found in Firebase Auth: ${email}`);
    process.exit(1);
  }

  console.log(`Found user: ${userRecord.displayName || 'N/A'} (${userRecord.uid})`);

  // 2. Get current Firestore document
  const userDoc = await db.collection('users').doc(userRecord.uid).get();
  if (userDoc.exists) {
    const data = userDoc.data();
    console.log(`Current tier: ${data.subscriptionTier || 'free'}`);
    console.log(`Current status: ${data.subscriptionStatus || 'none'}`);
  } else {
    console.log('No Firestore user document found (will create)');
  }

  // 3. Upgrade to Professional
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 90); // 90 days from now

  const updateData = {
    subscriptionTier: 'professional',
    subscriptionStatus: 'active',
    currentPeriodStart: admin.firestore.Timestamp.fromDate(now),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(periodEnd),
  };

  await db.collection('users').doc(userRecord.uid).set(updateData, { merge: true });

  console.log(`\nUpgraded ${email} to Professional tier`);
  console.log(`  Period: ${now.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]}`);
}

upgradeUser(email)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
