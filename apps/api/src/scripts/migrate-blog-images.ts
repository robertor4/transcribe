/**
 * Migration script to convert blog post hero images from signed URLs to public URLs.
 *
 * This script:
 * 1. Finds all blog posts with signed URLs (containing 'storage.googleapis.com' with signature params)
 * 2. Downloads the image from the old signed URL (if still valid) or the storage path
 * 3. Re-uploads to public/blog-images/{userId}/{timestamp}.webp
 * 4. Updates the Firestore document with the new public URL
 *
 * Run with: npx ts-node apps/api/src/scripts/migrate-blog-images.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

interface MigrationResult {
  analysisId: string;
  userId: string;
  success: boolean;
  oldUrl?: string;
  newUrl?: string;
  error?: string;
}

/**
 * Check if a URL is a signed URL (has signature parameters)
 */
function isSignedUrl(url: string): boolean {
  return url.includes('X-Goog-Signature') || url.includes('GoogleAccessId');
}

/**
 * Extract the storage path from a signed URL
 */
function extractPathFromSignedUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    // Find the bucket name index
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    const bucketIndex = pathParts.findIndex(
      (part) =>
        part === bucketName ||
        part.includes('.firebasestorage.app') ||
        part.includes('.appspot.com'),
    );

    if (bucketIndex !== -1) {
      return decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/'));
    }

    // Fallback: assume path starts after /o/ or after first non-empty segment
    const oIndex = pathParts.indexOf('o');
    if (oIndex !== -1) {
      return decodeURIComponent(pathParts.slice(oIndex + 1).join('/'));
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Migrate a single blog post's hero image
 */
async function migrateBlogImage(
  analysisId: string,
  userId: string,
  content: any,
): Promise<MigrationResult> {
  const result: MigrationResult = {
    analysisId,
    userId,
    success: false,
  };

  try {
    const heroImage = content.heroImage;
    if (!heroImage?.url) {
      result.error = 'No hero image URL found';
      return result;
    }

    result.oldUrl = heroImage.url;

    // Check if already using Firebase CDN format (correct format)
    if (heroImage.url.includes('firebasestorage.googleapis.com')) {
      result.success = true;
      result.newUrl = heroImage.url;
      result.error = 'Already using Firebase CDN URL, skipping';
      return result;
    }

    // Check if using wrong public URL format (storage.googleapis.com) - needs URL fix only
    if (heroImage.url.includes('storage.googleapis.com') && heroImage.url.includes('/public/blog-images/')) {
      // Extract path and convert to Firebase CDN format
      const urlObj = new URL(heroImage.url);
      const pathMatch = urlObj.pathname.match(/\/[^/]+\.firebasestorage\.app\/(.+)/);
      if (pathMatch) {
        const storagePath = decodeURIComponent(pathMatch[1]);
        const encodedPath = encodeURIComponent(storagePath);
        const newUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodedPath}?alt=media`;

        // Update Firestore with corrected URL
        const updatedContent = {
          ...content,
          heroImage: {
            ...heroImage,
            url: newUrl,
          },
        };
        await db.collection('generatedAnalyses').doc(analysisId).update({
          content: updatedContent,
        });

        result.success = true;
        result.newUrl = newUrl;
        console.log(`  Fixed URL format to Firebase CDN`);
        return result;
      }
    }

    // Skip if already a signed URL that's not for migration
    if (!isSignedUrl(heroImage.url) && !heroImage.url.includes('storage.googleapis.com')) {
      result.success = true;
      result.newUrl = heroImage.url;
      result.error = 'Unknown URL format, skipping';
      return result;
    }

    // Try to extract storage path from the signed URL
    const storagePath = extractPathFromSignedUrl(heroImage.url);
    if (!storagePath) {
      result.error = 'Could not extract storage path from URL';
      return result;
    }

    console.log(`  Found storage path: ${storagePath}`);

    // Check if the file exists at the old path
    const oldFile = bucket.file(storagePath);
    const [exists] = await oldFile.exists();

    if (!exists) {
      result.error = `File not found at path: ${storagePath}`;
      return result;
    }

    // Download the file
    console.log(`  Downloading from: ${storagePath}`);
    const [imageBuffer] = await oldFile.download();

    // Create new public path
    const newPath = `public/blog-images/${userId}/${Date.now()}.webp`;
    const newFile = bucket.file(newPath);

    // Upload to new public location
    // Note: public access is controlled by Firebase Storage rules, not object-level ACLs
    // (bucket uses uniform bucket-level access)
    console.log(`  Uploading to: ${newPath}`);
    await newFile.save(imageBuffer, {
      metadata: {
        contentType: 'image/webp',
      },
    });

    // Construct public URL using Firebase Storage CDN format
    // This format respects Firebase Storage rules (unlike storage.googleapis.com which needs IAM)
    const encodedPath = encodeURIComponent(newPath);
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
    result.newUrl = publicUrl;

    // Update Firestore document
    const updatedContent = {
      ...content,
      heroImage: {
        ...heroImage,
        url: publicUrl,
      },
    };

    await db.collection('generatedAnalyses').doc(analysisId).update({
      content: updatedContent,
    });

    console.log(`  Updated Firestore with new URL`);

    // Optionally delete old file (uncomment if you want to clean up)
    // await oldFile.delete();
    // console.log(`  Deleted old file`);

    result.success = true;
    return result;
  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('Starting blog image migration...\n');

  // Find all blog post analyses
  const snapshot = await db
    .collection('generatedAnalyses')
    .where('templateId', '==', 'blogPost')
    .get();

  console.log(`Found ${snapshot.size} blog post analyses\n`);

  const results: MigrationResult[] = [];
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const content = data.content;

    if (!content?.heroImage?.url) {
      console.log(`[${doc.id}] No hero image, skipping`);
      skipped++;
      continue;
    }

    console.log(`[${doc.id}] Processing...`);

    const result = await migrateBlogImage(doc.id, data.userId, content);
    results.push(result);

    if (result.success && result.newUrl !== result.oldUrl) {
      migrated++;
      console.log(`  ✓ Migrated successfully\n`);
    } else if (result.success) {
      skipped++;
      console.log(`  ○ Skipped: ${result.error}\n`);
    } else {
      failed++;
      console.log(`  ✗ Failed: ${result.error}\n`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n========== Migration Summary ==========');
  console.log(`Total blog posts: ${snapshot.size}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);

  // Log failed migrations for manual review
  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.log('\nFailed migrations:');
    failures.forEach((f) => {
      console.log(`  - ${f.analysisId}: ${f.error}`);
    });
  }

  process.exit(0);
}

// Run the migration
migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
