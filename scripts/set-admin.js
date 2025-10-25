// Script to set a user as admin
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

async function setAdminRole(email) {
  try {
    // Find user by email in Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${userRecord.uid} (${email})`);

    // Update user document in Firestore
    await db.collection('users').doc(userRecord.uid).update({
      role: 'admin',
      updatedAt: new Date(),
    });

    console.log(`✅ Successfully set ${email} as admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node set-admin.js <email>');
  process.exit(1);
}

setAdminRole(email);
