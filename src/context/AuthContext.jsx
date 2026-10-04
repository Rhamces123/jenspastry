import React, { useState, useEffect } from 'react';
import { AuthContext } from './useAuth.js';
import { ROLES, resolveRoleForUser } from '../constants/roles.js';
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
  updateDoc,
  collection,
  getDocs
} from 'firebase/firestore';

const DEMO_USER_KEY = 'bakeology_demo_current_user';
const DEMO_ACCOUNTS_KEY = 'bakeology_demo_accounts';

// Seed initial staff accounts into demo store if not already present
const INITIAL_DEMO_STAFF = [
  {
    uid: 'demo-cashier-001',
    email: 'cashier@jenspastry.com',
    password: 'JP_Cashier@2026!',
    fullName: 'Cashier Staff',
    displayName: 'Cashier Staff',
    role: ROLES.CASHIER,
    provider: 'password',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'demo-baker-002',
    email: 'baker@jenspastry.com',
    password: 'JP_Baker@2026!',
    fullName: 'Master Baker',
    displayName: 'Master Baker',
    role: ROLES.BAKER,
    provider: 'password',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'demo-admin-003',
    email: 'admin@jenspastry.com',
    password: 'JP_Admin@2026!',
    fullName: 'Store Owner / Admin',
    displayName: 'Store Owner / Admin',
    role: ROLES.ADMIN,
    provider: 'password',
    createdAt: new Date().toISOString()
  },
  {
    uid: 'demo-customer-004',
    email: 'customer@gmail.com',
    password: 'Password123!',
    fullName: 'Google Customer',
    displayName: 'Google Customer',
    photoURL: '',
    role: ROLES.CUSTOMER,
    provider: 'google',
    createdAt: new Date().toISOString()
  }
];

const ensureInitialDemoAccounts = () => {
  if (typeof window === 'undefined') return;
  try {
    const existing = JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || '[]');
    let modified = false;
    for (const staff of INITIAL_DEMO_STAFF) {
      const index = existing.findIndex(acc => acc.email.toLowerCase() === staff.email.toLowerCase());
      if (index === -1) {
        existing.push(staff);
        modified = true;
      } else {
        // Enforce latest official staff password and role
        if (existing[index].password !== staff.password || existing[index].role !== staff.role) {
          existing[index].password = staff.password;
          existing[index].role = staff.role;
          existing[index].fullName = staff.fullName;
          modified = true;
        }
      }
    }
    // Auto-heal any existing accounts in demo storage matching staff/admin patterns
    for (let i = 0; i < existing.length; i++) {
      const resolved = resolveRoleForUser(existing[i].email, existing[i].fullName, existing[i].role);
      if (existing[i].role !== resolved) {
        existing[i].role = resolved;
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(existing));
    }

    // Auto-heal active demo user session if present in localStorage
    const activeDemo = localStorage.getItem(DEMO_USER_KEY);
    if (activeDemo) {
      const parsed = JSON.parse(activeDemo);
      const resolved = resolveRoleForUser(parsed.email, parsed.fullName || parsed.displayName, parsed.role);
      if (parsed.role !== resolved) {
        parsed.role = resolved;
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(parsed));
      }
    }
  } catch (e) {
    console.warn("Could not seed demo staff accounts:", e);
  }
};

ensureInitialDemoAccounts();

const readInitialDemoUser = () => {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) {
    try {
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed) {
        const resolved = resolveRoleForUser(parsed.email, parsed.fullName || parsed.displayName, parsed.role);
        if (parsed.role !== resolved) {
          parsed.role = resolved;
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
      return null;
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
  const syncFirestoreProfile = async (firebaseUser, defaultRole = ROLES.CUSTOMER) => {
    if (!firebaseUser || !db) return null;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const resolvedRole = resolveRoleForUser(
          firebaseUser.email || data.email,
          data.fullName || firebaseUser.displayName,
          data.role || defaultRole
        );

        // Auto-heal Firestore if account was previously saved with misclassified role
        if (data.role !== resolvedRole) {
          try {
            await updateDoc(userRef, { role: resolvedRole, updatedAt: new Date().toISOString() });
          } catch (patchErr) {
            console.warn("Could not auto-heal user role in Firestore:", patchErr);
          }
        }

        const profileWithRole = { ...data, role: resolvedRole };
        setUserProfile(profileWithRole);
        return profileWithRole;
      } else {
        // Document doesn't exist yet (e.g. from Google sign-in)
        const isGoogle = firebaseUser.providerData?.some(p => p.providerId === 'google.com');
        const resolvedRole = resolveRoleForUser(firebaseUser.email, firebaseUser.displayName, defaultRole);
        const newProfile = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || (resolvedRole === ROLES.ADMIN ? 'Store Owner / Admin' : 'Customer'),
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          role: resolvedRole,
          provider: isGoogle ? 'google' : 'password',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn("Could not sync Firestore profile:", err);
      // Fallback profile from Firebase Auth user
      const isGoogle = firebaseUser.providerData?.some(p => p.providerId === 'google.com');
      const resolvedRole = resolveRoleForUser(firebaseUser.email, firebaseUser.displayName, defaultRole);
      const fallback = {
        uid: firebaseUser.uid,
        fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || (resolvedRole === ROLES.ADMIN ? 'Store Owner / Admin' : 'Customer'),
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        role: resolvedRole,
        provider: isGoogle ? 'google' : 'password',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
    const determinedRole = resolveRoleForUser(email, fullName, ROLES.CUSTOMER);
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
        photoURL: user.photoURL || '',
        role: determinedRole,
        provider: 'password',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), profileData);
      setUserProfile(profileData);
      return { user, profile: profileData };
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
        photoURL: '',
        role: determinedRole,
        provider: 'password',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      accounts.push({ ...newDemoUser, password });
      localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newDemoUser));
      setCurrentUser(newDemoUser);
      setUserProfile(newDemoUser);
      return { user: newDemoUser, profile: newDemoUser };
    }
  };

  /**
   * Log in user (Customer or Staff) with Email and Password
   */
  const login = async (email, password, rememberMe = true) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (isLive) {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        const profile = await syncFirestoreProfile(userCredential.user);
        return { user: userCredential.user, profile };
      } catch (liveErr) {
        // Auto-provisioning fallback for the 3 official staff accounts if they don't exist yet in Live Auth
        const officialStaff = INITIAL_DEMO_STAFF.find(
          s => s.email.toLowerCase() === cleanEmail && s.password === cleanPassword
        );

        if (officialStaff && (liveErr.code === 'auth/invalid-credential' || liveErr.code === 'auth/user-not-found')) {
          try {
            console.info(`[Staff Auto-Provision] Provisioning staff in Firebase: ${cleanEmail}`);
            const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
            const staffRecord = {
              uid: newCred.user.uid,
              fullName: officialStaff.fullName,
              email: cleanEmail,
              role: resolveRoleForUser(officialStaff.email, officialStaff.fullName, officialStaff.role),
              provider: 'password',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', newCred.user.uid), staffRecord);
            setUserProfile(staffRecord);
            setCurrentUser(newCred.user);
            return { user: newCred.user, profile: staffRecord };
          } catch (createErr) {
            console.warn("Could not auto-create in live Firebase Auth, falling back to local staff session:", createErr);
            // Seamless fallback to staff session so the user/admin is never blocked
            const localStaffUser = {
              uid: officialStaff.uid,
              email: officialStaff.email,
              displayName: officialStaff.fullName,
              fullName: officialStaff.fullName,
              photoURL: '',
              role: resolveRoleForUser(officialStaff.email, officialStaff.fullName, officialStaff.role),
              provider: 'password',
              createdAt: new Date().toISOString()
            };
            if (rememberMe) {
              localStorage.setItem(DEMO_USER_KEY, JSON.stringify(localStaffUser));
            } else {
              sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(localStaffUser));
            }
            setCurrentUser(localStaffUser);
            setUserProfile(localStaffUser);
            return { user: localStaffUser, profile: localStaffUser };
          }
        }
        throw liveErr;
      }
    } else {
      // Demo Mode
      const accounts = JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || '[]');
      let found = accounts.find(acc => acc.email.toLowerCase() === cleanEmail && acc.password === cleanPassword);
      if (!found) {
        // Fallback check directly in authoritative initial demo staff
        found = INITIAL_DEMO_STAFF.find(acc => acc.email.toLowerCase() === cleanEmail && acc.password === cleanPassword);
      }

      if (!found) {
        const err = new Error('Invalid email or password.');
        err.code = 'auth/invalid-credential';
        throw err;
      }
      const resolvedRole = resolveRoleForUser(found.email, found.fullName || found.displayName, found.role);
      const loggedIn = {
        uid: found.uid,
        email: found.email,
        displayName: found.fullName || found.displayName,
        fullName: found.fullName || found.displayName,
        photoURL: found.photoURL || '',
        role: resolvedRole,
        provider: found.provider || 'password',
        createdAt: found.createdAt,
        updatedAt: found.updatedAt || found.createdAt
      };
      if (rememberMe) {
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(loggedIn));
      } else {
        sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(loggedIn));
      }
      setCurrentUser(loggedIn);
      setUserProfile(loggedIn);
      return { user: loggedIn, profile: loggedIn };
    }
  };

  /**
   * Google Sign-In for Customers
   */
  const loginWithGoogle = async () => {
    if (isLive) {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncFirestoreProfile(result.user, ROLES.CUSTOMER);
      return { user: result.user, profile };
    } else {
      throw new Error('Google Sign-In is unavailable: Firebase is not configured.');
    }
  };

  /**
   * Admin: Fetch all users from Firestore (or Demo Accounts)
   */
  const getAllUsers = async () => {
    if (isLive && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const users = [];
        snap.forEach(d => users.push({ id: d.id, ...d.data() }));
        return users;
      } catch (e) {
        console.warn("Could not fetch users from Firestore:", e);
        return [];
      }
    } else {
      const accounts = JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || '[]');
      return accounts.map(({ password: _p, ...user }) => user);
    }
  };

  /**
   * Admin: Create a new Staff Account (Cashier, Baker, Admin)
   */
  const createStaffAccount = async ({ email, password, fullName, role }) => {
    if (![ROLES.CASHIER, ROLES.BAKER, ROLES.ADMIN].includes(role)) {
      throw new Error(`Invalid staff role: ${role}`);
    }

    if (isLive && db) {
      // In client-side Firebase, creating another user with createUserWithEmailAndPassword would log out the admin.
      // Therefore, we pre-provision the user profile document in Firestore with role, and mark as pending Auth.
      const staffDocRef = doc(collection(db, 'users'));
      const staffRecord = {
        uid: staffDocRef.id,
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role,
        provider: 'password',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(staffDocRef, staffRecord);
      return staffRecord;
    } else {
      // Demo Mode
      const accounts = JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || '[]');
      if (accounts.some(a => a.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('An account with this email already exists.');
      }
      const newStaff = {
        uid: `demo-staff-${Date.now()}`,
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        displayName: fullName.trim(),
        role,
        provider: 'password',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      accounts.push(newStaff);
      localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
      const { password: _p, ...safeUser } = newStaff;
      return safeUser;
    }
  };

  /**
   * Admin: Update User Role
   */
  const updateUserRole = async (userId, newRole) => {
    if (!Object.values(ROLES).includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    if (isLive && db) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
    } else {
      const accounts = JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || '[]');
      const index = accounts.findIndex(a => a.uid === userId);
      if (index !== -1) {
        accounts[index].role = newRole;
        accounts[index].updatedAt = new Date().toISOString();
        localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
      }
    }

    if (currentUser?.uid === userId) {
      setUserProfile(prev => ({ ...prev, role: newRole }));
    }
    return true;
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
    role: userProfile?.role || ROLES.CUSTOMER,
    loading,
    isLiveFirebase: Boolean(isLive),
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    getAllUsers,
    createStaffAccount,
    updateUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
