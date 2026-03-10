import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Promise that resolves when Firebase Auth has finished initializing
// This is critical for preventing race conditions where API requests
// are made before auth.currentUser is populated from IndexedDB
let authReadyResolve: (user: User | null) => void;
export const authReady: Promise<User | null> = new Promise((resolve) => {
  authReadyResolve = resolve;
});

// Track if auth has been initialized
let authInitialized = false;

// Listen for auth state changes - the first callback indicates auth is ready
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (!authInitialized) {
      authInitialized = true;
      authReadyResolve(user);
      // Keep listening for subsequent auth changes (handled by AuthContext)
    }
  });
}

// Lazy-load Firebase Analytics to avoid loading the GTM script on pages
// that don't use analytics (e.g. landing page). The ~60KB analytics bundle
// is only fetched when initAnalytics() is first called.
let analytics: Analytics | null = null;
let analyticsInitPromise: Promise<Analytics | null> | null = null;

export function initAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (analytics) return Promise.resolve(analytics);
  if (analyticsInitPromise) return analyticsInitPromise;

  analyticsInitPromise = import('firebase/analytics').then(
    ({ getAnalytics, isSupported }) =>
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
          if (process.env.NODE_ENV === 'development') {
            console.log('[Firebase Analytics] Debug mode enabled for development');
          }
          return analytics;
        }
        return null;
      }),
  );

  return analyticsInitPromise;
}

export { analytics };
export default app;