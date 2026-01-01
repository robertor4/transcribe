'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import websocketService from '@/lib/websocket';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  confirmPasswordReset: (oobCode: string, newPassword: string) => Promise<void>;
  verifyPasswordResetCode: (oobCode: string) => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
  sendPasswordResetEmail: async () => {},
  confirmPasswordReset: async () => {},
  verifyPasswordResetCode: async () => '',
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Always reload user to get latest email verification status
        try {
          await firebaseUser.reload();

          // Get the refreshed user
          const refreshedUser = auth.currentUser;
          setUser(refreshedUser);

          // Don't auto-redirect for unverified users - let pages handle it individually
          // This prevents redirect loops and flickering

          // Connect WebSocket only for verified users (non-blocking)
          if (refreshedUser && refreshedUser.emailVerified) {
            // Don't await - let WebSocket connect in background to avoid blocking UI
            websocketService.connect();
          }
        } catch (error) {
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        // Disconnect WebSocket when user logs out
        websocketService.disconnect();
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Memoize auth functions to prevent unnecessary re-renders
  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update the user's display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const confirmPasswordResetHandler = useCallback(async (oobCode: string, newPassword: string) => {
    await confirmPasswordReset(auth, oobCode, newPassword);
  }, []);

  const verifyPasswordResetCodeHandler = useCallback(async (oobCode: string) => {
    return await verifyPasswordResetCode(auth, oobCode);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.reload();
      // Force a new ID token to be generated with updated claims (like email_verified)
      // This is crucial because the backend validates email_verified from the token
      await currentUser.getIdToken(true);
      // After reload and token refresh, get the refreshed user and update state
      setUser(auth.currentUser);
    }
  }, []);

  // Memoize context value to prevent re-renders when values haven't changed
  const contextValue = useMemo(() => ({
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    sendPasswordResetEmail: resetPassword,
    confirmPasswordReset: confirmPasswordResetHandler,
    verifyPasswordResetCode: verifyPasswordResetCodeHandler,
    refreshUser,
  }), [user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, resetPassword, confirmPasswordResetHandler, verifyPasswordResetCodeHandler, refreshUser]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};