
import { initializeApp, getApp, getApps } from "https://esm.sh/firebase/app";
import { 
    initializeAuth, 
    browserLocalPersistence, 
    GoogleAuthProvider 
} from "https://esm.sh/firebase/auth";
import { getFirestore } from "https://esm.sh/firebase/firestore";

// IMPORTANT: Replace these with your actual Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyD0se3ss2CELT7Li2kP_1-T-bM-ZkF_5Xk",
  authDomain: "itg-blogs.firebaseapp.com",
  projectId: "itg-blogs",
  storageBucket: "itg-blogs.firebasestorage.app",
  messagingSenderId: "437730855856",
  appId: "1:437730855856:web:331465616737afaaa6a475",
  measurementId: "G-PQE2F83X50"
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && firebaseConfig.projectId !== "YOUR_PROJECT_ID_HERE";

let auth: any = null;
let db: any = null;
export const googleProvider = new GoogleAuthProvider();

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Use initializeAuth to explicitly set persistence
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });
    
    db = getFirestore(app);
    
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase is not configured. Authentication features will be disabled.");
}

export { auth, db };
