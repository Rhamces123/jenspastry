// ==========================================
// BAKEOLOGY - Firebase Configuration & Initialization
// Initializes Firebase Authentication and Cloud Firestore
// ==========================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

/**
 * Checks whether valid Firebase credentials have been configured in environment variables.
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
  const apiKey = firebaseConfig.apiKey;
  const projectId = firebaseConfig.projectId;

  return Boolean(
    apiKey &&
    projectId &&
    apiKey !== 'your_firebase_api_key_here' &&
    projectId !== 'your_project_id' &&
    !apiKey.includes('placeholder')
  );
}

let app = null;
let auth = null;
let db = null;
const googleProvider = new GoogleAuthProvider();

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error("Firebase initialization error:", err);
  }
} else {
  console.info(
    "ℹ️ [BAKEOLOGY] Firebase credentials not yet detected in environment. Operating in demo mode. Add credentials to .env to connect your live Firebase project."
  );
}

export { app, auth, db, googleProvider, firebaseConfig };
