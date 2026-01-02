/**
 * Script to check conversation/transcription data for AI assets
 * Run with: node scripts/check-conversation-assets.js <conversationId>
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from root
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkConversationAssets(conversationId) {
  console.log(`\n========================================`);
  console.log(`Checking conversation: ${conversationId}`);
  console.log(`========================================\n`);

  // 1. Get the transcription document
  const transcriptionDoc = await db.collection('transcriptions').doc(conversationId).get();

  if (!transcriptionDoc.exists) {
    console.log('❌ Transcription not found!');
    return;
  }

  const data = transcriptionDoc.data();

  console.log('📄 TRANSCRIPTION DOCUMENT:');
  console.log('---------------------------');
  console.log(`Title: ${data.title || data.fileName}`);
  console.log(`Status: ${data.status}`);
  console.log(`Created: ${data.createdAt?.toDate?.() || data.createdAt}`);

  // Check generatedAnalysisIds
  console.log(`\n🔍 generatedAnalysisIds field:`);
  if (data.generatedAnalysisIds) {
    console.log(`  Count: ${data.generatedAnalysisIds.length}`);
    console.log(`  IDs: ${JSON.stringify(data.generatedAnalysisIds)}`);
  } else {
    console.log(`  ❌ Field is undefined or null`);
  }

  // Check summaryV2
  console.log(`\n📝 summaryV2 field:`);
  if (data.summaryV2) {
    console.log(`  ✅ Present`);
    console.log(`  Title: ${data.summaryV2.title}`);
  } else {
    console.log(`  ❌ Not present`);
  }

  // Check coreAnalyses (legacy)
  console.log(`\n📝 coreAnalyses field (legacy):`);
  if (data.coreAnalyses) {
    console.log(`  ✅ Present`);
    console.log(`  Has summary: ${!!data.coreAnalyses.summary}`);
    console.log(`  Has summaryV2: ${!!data.coreAnalyses.summaryV2}`);
    console.log(`  Has actionItems: ${!!data.coreAnalyses.actionItems}`);
    console.log(`  Has communicationStyles: ${!!data.coreAnalyses.communicationStyles}`);
  } else {
    console.log(`  ❌ Not present`);
  }

  // 2. Check generatedAnalyses collection for this transcription
  console.log(`\n🗂️  GENERATED ANALYSES COLLECTION:`);
  console.log('----------------------------------');

  const generatedAnalysesSnapshot = await db
    .collection('generatedAnalyses')
    .where('transcriptionId', '==', conversationId)
    .get();

  if (generatedAnalysesSnapshot.empty) {
    console.log(`  ❌ No generated analyses found in collection`);
  } else {
    console.log(`  ✅ Found ${generatedAnalysesSnapshot.size} generated analyses:`);
    generatedAnalysesSnapshot.forEach((doc, index) => {
      const analysis = doc.data();
      console.log(`\n  [${index + 1}] ID: ${doc.id}`);
      console.log(`      Template: ${analysis.templateName} (${analysis.templateId})`);
      console.log(`      Content Type: ${analysis.contentType}`);
      console.log(`      Generated At: ${analysis.generatedAt?.toDate?.() || analysis.generatedAt}`);
    });
  }

  // 3. Summary of the issue
  console.log(`\n\n📊 DIAGNOSIS:`);
  console.log('=============');

  const hasGeneratedAnalysisIds = data.generatedAnalysisIds && data.generatedAnalysisIds.length > 0;
  const hasActualAnalyses = !generatedAnalysesSnapshot.empty;

  if (hasGeneratedAnalysisIds && !hasActualAnalyses) {
    console.log(`⚠️  MISMATCH DETECTED!`);
    console.log(`   - generatedAnalysisIds has ${data.generatedAnalysisIds.length} IDs`);
    console.log(`   - But NO actual documents found in generatedAnalyses collection`);
    console.log(`   - This causes the badge to show but "No AI Assets" on detail page`);
    console.log(`\n   FIX: Clear the generatedAnalysisIds array or investigate missing docs`);
  } else if (!hasGeneratedAnalysisIds && hasActualAnalyses) {
    console.log(`⚠️  MISMATCH DETECTED!`);
    console.log(`   - generatedAnalysisIds is empty/undefined`);
    console.log(`   - But ${generatedAnalysesSnapshot.size} documents exist in collection`);
    console.log(`\n   FIX: Update generatedAnalysisIds with the correct IDs`);
  } else if (hasGeneratedAnalysisIds && hasActualAnalyses) {
    // Check if IDs match
    const actualIds = generatedAnalysesSnapshot.docs.map(d => d.id);
    const storedIds = data.generatedAnalysisIds;
    const missing = storedIds.filter(id => !actualIds.includes(id));
    const extra = actualIds.filter(id => !storedIds.includes(id));

    if (missing.length > 0 || extra.length > 0) {
      console.log(`⚠️  ID MISMATCH!`);
      if (missing.length > 0) console.log(`   Missing from collection: ${JSON.stringify(missing)}`);
      if (extra.length > 0) console.log(`   Not in generatedAnalysisIds: ${JSON.stringify(extra)}`);
    } else {
      console.log(`✅ Data is consistent - ${actualIds.length} analyses`);
    }
  } else {
    console.log(`✅ No AI assets (both field and collection are empty)`);
  }
}

// Get conversation ID from command line
const conversationId = process.argv[2];

if (!conversationId) {
  console.log('Usage: node scripts/check-conversation-assets.js <conversationId>');
  console.log('Example: node scripts/check-conversation-assets.js Aloiu1R7TabGkXsa3ROo');
  process.exit(1);
}

checkConversationAssets(conversationId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
