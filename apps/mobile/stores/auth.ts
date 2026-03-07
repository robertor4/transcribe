import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

function toAuthUser(firebaseUser: FirebaseAuthTypes.User): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: () => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        set({ user: toAuthUser(firebaseUser), initialized: true });
      } else {
        set({ user: null, initialized: true });
      }
    });

    // Return unsubscribe for cleanup (not used in practice since store is global)
    return unsubscribe;
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const credential = await auth().signInWithEmailAndPassword(email, password);
      if (!credential.user.emailVerified) {
        await auth().signOut();
        throw new Error('Please verify your email before signing in.');
      }
    } finally {
      set({ loading: false });
    }
  },

  signUpWithEmail: async (email: string, password: string, displayName?: string) => {
    set({ loading: true });
    try {
      const credential = await auth().createUserWithEmailAndPassword(email, password);
      if (displayName) {
        await credential.user.updateProfile({ displayName });
      }
      await credential.user.sendEmailVerification();
      // Sign out after registration — user must verify email first
      await auth().signOut();
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error('Google sign-in failed: no ID token returned.');
      }
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await auth().signOut();
    set({ user: null });
  },

  getIdToken: async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) return null;
    return currentUser.getIdToken();
  },
}));
