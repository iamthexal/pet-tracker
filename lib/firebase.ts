import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Custom domains for different environments
const customDomains = {
  production: "petlogger.clivethings.com",
  development: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

// Get current environment
const isProduction = process.env.NODE_ENV === 'production';

// Validate auth domain
const authDomain = isProduction ? customDomains.production : customDomains.development;
if (!authDomain) {
  throw new Error(
    isProduction 
      ? 'Production auth domain is not configured' 
      : 'Development auth domain is not configured in environment variables'
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required environment variables
if (!firebaseConfig.apiKey) throw new Error('Firebase API Key is required');
if (!firebaseConfig.authDomain) throw new Error('Firebase Auth Domain is required');
if (!firebaseConfig.projectId) throw new Error('Firebase Project ID is required');
if (!firebaseConfig.storageBucket) throw new Error('Firebase Storage Bucket is required');
if (!firebaseConfig.messagingSenderId) throw new Error('Firebase Messaging Sender ID is required');
if (!firebaseConfig.appId) throw new Error('Firebase App ID is required');

// Initialize Firebase, ensuring only one instance exists
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Add debugging for development environment
if (process.env.NODE_ENV === 'development') {
  console.log('Current Auth Domain:', firebaseConfig.authDomain);
  
  onAuthStateChanged(auth, (user) => {
    console.log('Auth State Changed:', user ? 'User Logged In' : 'No User');
    if (user) {
      console.log('User ID:', user.uid);
    }
  });
}

export { app, db, auth, storage };