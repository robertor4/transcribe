import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

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

// Initialize Analytics only in browser environment
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);

      // Enable debug mode in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Firebase Analytics] Debug mode enabled for development');
        // Debug events will be sent to DebugView in Firebase Console
      }
    }
  });
}

export { analytics };
export default app;