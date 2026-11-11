/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'firebase/app' {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
  export function getApp(): any;
}

declare module 'firebase/auth' {
  export function getAuth(app?: any): any;
  export function signInWithEmailAndPassword(auth: any, email: string, password?: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: any, email: string, password?: string): Promise<any>;
  export function signInWithCredential(auth: any, credential: any): Promise<any>;
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
  export class GoogleAuthProvider {
    static credential(idToken: string, accessToken?: string): any;
  }
  export function signOut(auth: any): Promise<any>;
  export function onAuthStateChanged(auth: any, callback: any): any;
  export function sendEmailVerification(user: any, actionCodeSettings?: any): Promise<void>;
  export function sendPasswordResetEmail(auth: any, email: string, actionCodeSettings?: any): Promise<void>;
  export function updateProfile(user: any, profile: { displayName?: string | null; photoURL?: string | null }): Promise<void>;
  export function reload(user: any): Promise<void>;
  export type User = any;
}

declare module 'firebase/firestore' {
  export function getFirestore(app?: any): any;
  export function collection(db: any, ...pathSegments: string[]): any;
  export function doc(db: any, ...pathSegments: string[]): any;
  export function getDoc(docRef: any): Promise<any>;
  export function getDocs(query: any): Promise<any>;
  export function setDoc(docRef: any, data: any, options?: any): Promise<any>;
  export function updateDoc(docRef: any, data: any): Promise<any>;
  export function deleteDoc(docRef: any): Promise<any>;
  export function addDoc(colRef: any, data: any): Promise<any>;
  export function query(colRef: any, ...queryConstraints: any[]): any;
  export function where(fieldPath: string, opStr: any, value: any): any;
  export function orderBy(fieldPath: string, directionStr?: any): any;
  export function limit(limitNum: number): any;
  export function onSnapshot(ref: any, onNext: any, onError?: any): any;
  export function writeBatch(db: any): any;
  export function serverTimestamp(): any;
}

declare module 'firebase/storage' {
  export function getStorage(app?: any): any;
  export function ref(storage: any, urlOrPath?: string): any;
  export function uploadBytesResumable(storageRef: any, data: any, metadata?: any): any;
  export function getDownloadURL(storageRef: any): Promise<string>;
  export function deleteObject(storageRef: any): Promise<void>;
}
