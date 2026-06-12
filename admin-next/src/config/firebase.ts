import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

// Note: Firebase API keys and App IDs are public identifiers by design (not secrets).
// They are safe to expose in client-side code. See: https://firebase.google.com/docs/projects/api-keys
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAKHP3mQVTS4bC89758sRxYGCZcnx7jdPY",
  authDomain: "hello-94480.firebaseapp.com",
  projectId: "hello-94480",
  storageBucket: "hello-94480.firebasestorage.app",
  messagingSenderId: "127107907906",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:127107907906:web:09e78330b89c7dd669c8db"
};
  
// Initialize Firebase - singleton pattern
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configure provider settings
provider.addScope('profile');
provider.addScope('email');

// Set custom parameters to avoid continue URL issues
provider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, provider };
export default app;
