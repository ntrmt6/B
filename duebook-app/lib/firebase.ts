import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

// Firebase Web API keys are public identifiers by design (not secrets).
// Same project as admin-next / storefront-next.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAKHP3mQVTS4bC89758sRxYGCZcnx7jdPY',
  authDomain: 'hello-94480.firebaseapp.com',
  projectId: 'hello-94480',
  storageBucket: 'hello-94480.firebasestorage.app',
  messagingSenderId: '127107907906',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:127107907906:web:09e78330b89c7dd669c8db',
};

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');
provider.setCustomParameters({ prompt: 'select_account' });

export { auth, provider };
export default app;
