import 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfigRaw from '../firebase-applet-config.json';

const firebaseConfig = firebaseConfigRaw as any;

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Suppress Firestore verbose warnings/logs such as offline/connection notices
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore
}

// Initialize Firestore matching the official AI Studio Firebase skill directive
export const firestore: Firestore = (() => {
  const databaseId = firebaseConfig.firestoreDatabaseId;
  try {
    return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  } catch (err) {
    console.warn('[Firebase] Primary getFirestore failed, attempting fallback:', err);
    try {
      return getFirestore(app);
    } catch (finalErr) {
      console.warn('[Firebase] Firestore service unavailable in current browser environment, local storage will be used:', finalErr);
      return {
        type: 'firestore',
        app,
        toJSON: () => ({}),
      } as unknown as Firestore;
    }
  }
})();

/**
 * Validate connection to Cloud Firestore backend on app boot.
 * Uses a fast 2-second timeout race and navigator status to prevent 10-second backend timeout notices.
 */
export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.info('[Firestore] Browser offline. Local storage persistence active.');
    return false;
  }

  try {
    const checkPromise = getDoc(doc(firestore, '_connection_', 'status'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Backend ping timeout')), 2000)
    );

    await Promise.race([checkPromise, timeoutPromise]);
    return true;
  } catch {
    console.info('[Firestore] Operating in local offline persistence mode.');
    return false;
  }
}

// Connection check is available on demand when sync is invoked
export default app;
