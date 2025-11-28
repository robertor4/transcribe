#!/usr/bin/env node

/**
 * Script to grant a professional subscription to a user directly via Firestore
 * This bypasses Stripe and is useful for complimentary subscriptions
 *
 * Usage: node scripts/grant-subscription.js
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Configuration
const USER_ID = 'u1HQWG3ifJNiB7F8Z3BG1WBdcUi2';
const SUBSCRIPTION_TIER = 'professional'; // 'free', 'payg', 'professional', 'business', 'enterprise'
const DURATION_DAYS = 365; // 1 year

// Validate environment variables
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  console.error(`   ${missingVars.join(', ')}`);
  console.error('\nPlease ensure these are set in your .env file');
  process.exit(1);
}

// Initialize Firebase Admin with environment variables
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
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function grantProfessionalSubscription() {
  try {
    console.log(`\n🎯 Granting ${SUBSCRIPTION_TIER} subscription to user: ${USER_ID}`);
    console.log(`📅 Duration: ${DURATION_DAYS} days\n`);

    // Check if user exists
    const userRef = db.collection('users').doc(USER_ID);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error(`❌ User with ID ${USER_ID} does not exist in Firestore`);
      console.error(`\nPlease verify the user ID is correct.`);
      process.exit(1);
    }

    const currentData = userDoc.data();
    console.log(`👤 User found: ${currentData.email || 'No email'}`);
    console.log(`📊 Current tier: ${currentData.subscriptionTier || 'free'}`);

    if (currentData.stripeSubscriptionId) {
      console.log(`⚠️  Warning: User has existing Stripe subscription: ${currentData.stripeSubscriptionId}`);
      console.log(`   This manual grant will override the Stripe subscription.`);
    }

    // Calculate dates
    const now = new Date();
    const endDate = new Date(now.getTime() + DURATION_DAYS * 24 * 60 * 60 * 1000);

    // Prepare subscription data
    const subscriptionData = {
      // Core subscription fields
      subscriptionTier: SUBSCRIPTION_TIER,
      subscriptionStatus: 'active',

      // Billing period - 1 year from now
      currentPeriodStart: admin.firestore.Timestamp.fromDate(now),
      currentPeriodEnd: admin.firestore.Timestamp.fromDate(endDate),

      // Clear Stripe fields to indicate manual subscription
      stripeCustomerId: null,
      stripeSubscriptionId: null,

      // Reset usage for the new period
      usageThisMonth: {
        hours: 0,
        transcriptions: 0,
        onDemandAnalyses: 0,
        lastResetAt: admin.firestore.Timestamp.fromDate(now)
      },

      // Metadata
      updatedAt: admin.firestore.Timestamp.fromDate(now),
      subscriptionNote: `Manual grant via script on ${now.toISOString()}`
    };

    // Update the user document
    await userRef.update(subscriptionData);

    console.log(`\n✅ Successfully granted ${SUBSCRIPTION_TIER} subscription!`);
    console.log(`\n📋 Subscription Details:`);
    console.log(`   - Tier: ${SUBSCRIPTION_TIER}`);
    console.log(`   - Status: active`);
    console.log(`   - Start: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);
    console.log(`   - End: ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString()}`);
    console.log(`   - Duration: ${DURATION_DAYS} days`);

    console.log(`\n🎁 Professional Tier Benefits:`);
    console.log(`   - 60 hours per month of transcription`);
    console.log(`   - 5GB max file size`);
    console.log(`   - Unlimited transcriptions (no count limit)`);
    console.log(`   - Unlimited file duration`);
    console.log(`   - Unlimited on-demand analyses`);
    console.log(`   - Priority processing`);
    console.log(`   - Advanced sharing features`);
    console.log(`   - Batch upload support`);

    console.log(`\n⚠️  Important Notes:`);
    console.log(`   - This is a manual subscription (bypasses Stripe)`);
    console.log(`   - It will NOT auto-renew`);
    console.log(`   - Expires on: ${endDate.toLocaleDateString()}`);
    console.log(`   - Usage resets monthly on the 1st via cron job`);

    // Verify the update
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();
    if (updatedData.subscriptionTier === SUBSCRIPTION_TIER) {
      console.log(`\n✅ Verification: Subscription successfully updated in Firestore`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user subscription:', error);
    process.exit(1);
  }
}

// Run the script
grantProfessionalSubscription();