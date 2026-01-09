/**
 * Lazy-loaded Firebase module
 *
 * This module provides lazy initialization of Firebase services to avoid
 * bundling Firebase with pages that don't need it (like the landing page).
 *
 * Usage:
 * - Import from this file when you need Firebase on-demand
 * - For contexts/pages that always need Firebase, use the regular firebase.ts
 */

import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Analytics } from 'firebase/analytics';

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let firebaseAnalytics: Analytics | null = null;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Lazily initialize Firebase App
 */
export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (firebaseApp) return firebaseApp;

  const { initializeApp, getApps } = await import('firebase/app');
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return firebaseApp;
}

/**
 * Lazily initialize Firebase Auth
 */
export async function getFirebaseAuth(): Promise<Auth> {
  if (firebaseAuth) return firebaseAuth;

  const app = await getFirebaseApp();
  const { getAuth } = await import('firebase/auth');
  firebaseAuth = getAuth(app);
  return firebaseAuth;
}

/**
 * Lazily initialize Firestore
 */
export async function getFirebaseDb(): Promise<Firestore> {
  if (firebaseDb) return firebaseDb;

  const app = await getFirebaseApp();
  const { getFirestore } = await import('firebase/firestore');
  firebaseDb = getFirestore(app);
  return firebaseDb;
}

/**
 * Lazily initialize Firebase Storage
 */
export async function getFirebaseStorage(): Promise<FirebaseStorage> {
  if (firebaseStorage) return firebaseStorage;

  const app = await getFirebaseApp();
  const { getStorage } = await import('firebase/storage');
  firebaseStorage = getStorage(app);
  return firebaseStorage;
}

/**
 * Lazily initialize Firebase Analytics (browser only)
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (firebaseAnalytics) return firebaseAnalytics;

  const app = await getFirebaseApp();
  const { getAnalytics, isSupported } = await import('firebase/analytics');

  const supported = await isSupported();
  if (!supported) return null;

  firebaseAnalytics = getAnalytics(app);
  return firebaseAnalytics;
}

/**
 * Wait for Firebase Auth to be ready and return the current user
 */
export async function waitForAuthReady(): Promise<User | null> {
  const auth = await getFirebaseAuth();
  const { onAuthStateChanged } = await import('firebase/auth');

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
