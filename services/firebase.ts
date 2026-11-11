import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyAPQrWcB7duRT-uUbu6GBRGWUz9B87E07U",
  authDomain: "rwanin-movies.firebaseapp.com",
  projectId: "rwanin-movies",
  storageBucket: "rwanin-movies.firebasestorage.app",
  messagingSenderId: "148800265407",
  appId: "1:148800265407:web:7612ca96b4d99eb1543a0a",
  measurementId: "G-6RJLH92HYT"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const isFirebaseConnected = () => {
  return Boolean(app && app.options.projectId === "rwanin-movies");
};
