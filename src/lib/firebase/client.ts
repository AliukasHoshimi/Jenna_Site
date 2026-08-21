import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let cachedAuth: Auth | null = null;

/**
 * Lazy on purpose: getAuth() validates the API key format eagerly and
 * throws if it's missing, which would otherwise crash Next's build-time
 * prerender of any page that imported this at module scope before real
 * Firebase config exists. Call this from inside an event handler instead.
 */
export function getClientAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  cachedAuth = getAuth(app);
  return cachedAuth;
}
