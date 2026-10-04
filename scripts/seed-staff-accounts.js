// ==========================================
// Jen's Pastry Shop - Staff Accounts Seeding Script
// Provisions the 3 official staff accounts:
// 1. cashier@jenspastry.com (Cashier)
// 2. baker@jenspastry.com   (Baker)
// 3. admin@jenspastry.com   (Store Owner / Admin)
// ==========================================

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Environment variables or fallback to project configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const STAFF_ACCOUNTS = [
  {
    email: 'cashier@jenspastry.com',
    password: process.env.INITIAL_CASHIER_PASSWORD || 'JP_Cashier@2026!',
    fullName: "Jen's Pastry Cashier",
    role: 'cashier'
  },
  {
    email: 'baker@jenspastry.com',
    password: process.env.INITIAL_BAKER_PASSWORD || 'JP_Baker@2026!',
    fullName: "Jen's Pastry Master Baker",
    role: 'baker'
  },
  {
    email: 'admin@jenspastry.com',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'JP_Admin@2026!',
    fullName: "Jen Pastry Owner",
    role: 'admin'
  }
];

async function seed() {
  console.log("==================================================");
  console.log("Jen's Pastry Shop - Seeding Initial Staff Accounts");
  console.log("==================================================");

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.log("⚠ No live Firebase configuration detected in environment variables.");
    console.log("  In Demo Mode (Localhost / Mocked Firebase), these accounts are automatically");
    console.log("  pre-seeded in AuthContext and can be used immediately with these credentials:");
    console.log("");
    STAFF_ACCOUNTS.forEach(acc => {
      console.log(`  Role:     ${acc.role.toUpperCase()}`);
      console.log(`  Email:    ${acc.email}`);
      console.log(`  Password: ${acc.password}`);
      console.log("  ----------------------------------------------");
    });
    console.log("");
    console.log("To seed into your LIVE Firebase project:");
    console.log("1. Set your Firebase environment variables in .env (see .env.example)");
    console.log("2. Run: node scripts/seed-staff-accounts.js");
    console.log("3. OR manually create these accounts in Firebase Authentication Console,");
    console.log("   then create documents under 'users/{uid}' with the respective 'role'.");
    return;
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  for (const account of STAFF_ACCOUNTS) {
    console.log(`\nProcessing ${account.role.toUpperCase()}: ${account.email}...`);
    let uid = null;

    try {
      // Try to create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
      uid = userCredential.user.uid;
      console.log(`✓ User created in Firebase Auth with UID: ${uid}`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`ℹ Account already exists in Auth. Authenticating to obtain UID...`);
        try {
          const userCredential = await signInWithEmailAndPassword(auth, account.email, account.password);
          uid = userCredential.user.uid;
          console.log(`✓ Successfully authenticated existing account. UID: ${uid}`);
        } catch (signInErr) {
          console.error(`✗ Could not sign in to existing account: ${signInErr.message}`);
          continue;
        }
      } else {
        console.error(`✗ Error creating Auth account: ${err.message}`);
        continue;
      }
    }

    if (uid) {
      try {
        const userRef = doc(db, 'users', uid);
        const existingDoc = await getDoc(userRef);
        
        await setDoc(userRef, {
          uid,
          email: account.email,
          fullName: account.fullName,
          role: account.role,
          provider: 'password',
          status: 'active',
          updatedAt: new Date().toISOString(),
          ...(existingDoc.exists() ? {} : { createdAt: new Date().toISOString() })
        }, { merge: true });

        console.log(`✓ Firestore user profile created/updated at users/${uid} with role: '${account.role}'`);
      } catch (dbErr) {
        console.error(`✗ Failed to update Firestore profile: ${dbErr.message}`);
      }
    }
  }

  console.log("\n==================================================");
  console.log("Staff account provisioning complete!");
  console.log("==================================================");
}

seed().catch(console.error);
