'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hasRedirectedToVerify, setHasRedirectedToVerify] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Always reload user to get latest email verification status
        try {
          await user.reload();
          // Get the refreshed user
          const refreshedUser = auth.currentUser;
          setUser(refreshedUser);

          // Don't auto-redirect for unverified users - let pages handle it individually
          // This prevents redirect loops and flickering

          // Connect WebSocket only for verified users
          if (refreshedUser && refreshedUser.emailVerified) {
            await websocketService.connect();
          }
        } catch (error) {
          setUser(user);
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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const confirmPasswordResetHandler = async (oobCode: string, newPassword: string) => {
    await confirmPasswordReset(auth, oobCode, newPassword);
  };

  const verifyPasswordResetCodeHandler = async (oobCode: string) => {
    return await verifyPasswordResetCode(auth, oobCode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        sendPasswordResetEmail: resetPassword,
        confirmPasswordReset: confirmPasswordResetHandler,
        verifyPasswordResetCode: verifyPasswordResetCodeHandler,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};