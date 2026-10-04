// ==========================================
// BAKEOLOGY - Authentication Context
// Manages Firebase Authentication state, user profile, and session persistence
// ==========================================

import React, { useState, useEffect } from 'react';
import { AuthContext } from './useAuth.js';
import { 
  auth, 
  db, 
  googleProvider, 
  isFirebaseConfigured 
} from '../firebase.js';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';

const DEMO_USER_KEY = 'bakeology_demo_current_user';
const DEMO_ACCOUNTS_KEY = 'bakeology_demo_accounts';

const readInitialDemoUser = () => {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) {
    try {
      const stored = localStorage.getItem(DEMO_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  return null;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(readInitialDemoUser);
  const [userProfile, setUserProfile] = useState(readInitialDemoUser);
  const [loading, setLoading] = useState(() => isFirebaseConfigured());
  const isLive = isFirebaseConfigured() && auth && db;

  // Helper to fetch and sync user profile from Firestore
  const syncFirestoreProfile = async (firebaseUser) => {
    if (!firebaseUser || !db) return null;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserProfile(data);
        return data;
      } else {
        // Document doesn't exist yet (e.g. from Google sign-in)
        const newProfile = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
          email: firebaseUser.email,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn("Could not sync Firestore profile:", err);
      // Fallback profile from Firebase Auth user
      const fallback = {
        uid: firebaseUser.uid,
        fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
        email: firebaseUser.email,
        createdAt: new Date().toISOString()
      };
      setUserProfile(fallback);
      return fallback;
    }
  };

  // Listen to Auth State Changes
  useEffect(() => {
    if (!isLive) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncFirestoreProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [isLive]);

  /**
   * Register a new customer with Email, Password, and Full Name
   */
  const signup = async (email, password, fullName) => {
    if (isLive) {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Set Firebase Auth display name
      if (fullName) {
        await updateProfile(user, { displayName: fullName });
      }

      // 3. Save customer profile document in Firestore
      const profileData = {
        uid: user.uid,
        fullName: fullName || email.split('@')[0],
        email: user.email,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), profileData);
      setUserProfile(profileData);
      return user;
    } else {
      // Demo Mode
      const accounts = JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || '[]');
      if (accounts.some(acc => acc.email.toLowerCase() === email.toLowerCase())) {
        const err = new Error('The email address is already in use by another account.');
        err.code = 'auth/email-already-in-use';
        throw err;
      }
      const newDemoUser = {
        uid: `demo-${Date.now()}`,
        email,
        displayName: fullName || email.split('@')[0],
        fullName: fullName || email.split('@')[0],
        createdAt: new Date().toISOString()
      };
      accounts.push({ ...newDemoUser, password });
      localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newDemoUser));
      setCurrentUser(newDemoUser);
      setUserProfile(newDemoUser);
      return newDemoUser;
    }
  };

  /**
   * Log in an existing customer with Email and Password
   */
  const login = async (email, password, rememberMe = true) => {
    if (isLive) {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncFirestoreProfile(userCredential.user);
      return userCredential.user;
    } else {
      // Demo Mode
      const accounts = JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || '[]');
      const found = accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password);
      if (!found) {
        const err = new Error('Invalid email or password.');
        err.code = 'auth/invalid-credential';
        throw err;
      }
      const loggedIn = {
        uid: found.uid,
        email: found.email,
        displayName: found.fullName || found.displayName,
        fullName: found.fullName || found.displayName,
        createdAt: found.createdAt
      };
      if (rememberMe) {
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(loggedIn));
      } else {
        sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(loggedIn));
      }
      setCurrentUser(loggedIn);
      setUserProfile(loggedIn);
      return loggedIn;
    }
  };

  /**
   * Optional Google Sign-In
   */
  const loginWithGoogle = async () => {
    if (isLive) {
      const result = await signInWithPopup(auth, googleProvider);
      await syncFirestoreProfile(result.user);
      return result.user;
    } else {
      const googleDemoUser = {
        uid: `google-demo-${Date.now()}`,
        email: 'customer@gmail.com',
        displayName: 'Google Customer',
        fullName: 'Google Customer',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(googleDemoUser));
      setCurrentUser(googleDemoUser);
      setUserProfile(googleDemoUser);
      return googleDemoUser;
    }
  };

  /**
   * Log out the current customer
   */
  const logout = async () => {
    if (isLive) {
      await signOut(auth);
    } else {
      localStorage.removeItem(DEMO_USER_KEY);
      sessionStorage.removeItem(DEMO_USER_KEY);
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  /**
   * Send Password Reset Email
   */
  const resetPassword = async (email) => {
    if (isLive) {
      await sendPasswordResetEmail(auth, email);
    } else {
      // Demo Mode simulation
      await new Promise(r => setTimeout(r, 600));
    }
    return true;
  };

  /**
   * Update Profile Details (Full Name) in Auth and Firestore
   */
  const updateUserProfile = async ({ fullName }) => {
    if (!currentUser) throw new Error("No user is currently signed in.");

    const updatedName = fullName?.trim();
    if (!updatedName) throw new Error("Full name cannot be empty.");

    if (isLive) {
      await updateProfile(auth.currentUser, { displayName: updatedName });
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fullName: updatedName,
        updatedAt: new Date().toISOString()
      });
      setUserProfile(prev => ({ ...prev, fullName: updatedName }));
    } else {
      const updated = {
        ...currentUser,
        displayName: updatedName,
        fullName: updatedName,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
      setCurrentUser(updated);
      setUserProfile(updated);
    }
    return true;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    isLiveFirebase: Boolean(isLive),
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
