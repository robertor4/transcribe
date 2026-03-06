#!/usr/bin/env node
/**
 * Upload blog video assets to Firebase Storage.
 * Usage: node scripts/upload-blog-videos.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { resolve, basename } from 'path';
import { config } from 'dotenv';

config(); // Load .env

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = getStorage(app).bucket();

const files = [
  'apps/video/out/blog-speed-gap.mp4',
  'apps/video/out/blog-deliverable-cascade.mp4',
  'apps/video/out/blog-roi-counter.mp4',
];

for (const filePath of files) {
  const fullPath = resolve(filePath);
  const name = basename(filePath, '.mp4');
  const dest = `public/blog-videos/${name}-v3.mp4`;

  console.log(`Uploading ${name} → ${dest}...`);

  const buffer = readFileSync(fullPath);
  const file = bucket.file(dest);

  await file.save(buffer, {
    metadata: {
      contentType: 'video/mp4',
      cacheControl: 'public, max-age=3600', // 1 hour cache
    },
  });

  const encodedPath = encodeURIComponent(dest);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
  console.log(`  ✔ ${url}`);
}

console.log('\nDone! All videos uploaded.');
