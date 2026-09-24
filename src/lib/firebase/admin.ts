import "server-only";

import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Server-side Firebase Admin SDK.
 *
 * Credentials are read from the environment and never leave the server. When
 * they are absent the app stays fully renderable: the public site falls back to
 * the bundled default content (see `lib/cms/defaults.ts`) so the project can be
 * run and reviewed before a Firebase project exists. Any *write* still fails
 * loudly rather than silently pretending to succeed.
 *
 * Two ways to authenticate:
 * - Service account key (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) for local
 *   development and `npm run seed`.
 * - Application Default Credentials on Firebase App Hosting, where the server
 *   already runs as a service account, so no private key has to be stored.
 *   App Hosting injects FIREBASE_CONFIG; FIREBASE_USE_ADC=true forces it too.
 */

/** FIREBASE_CONFIG is injected by Firebase App Hosting at build and run time. */
function hostedFirebaseConfig(): { projectId?: string; storageBucket?: string } | null {
  const raw = process.env.FIREBASE_CONFIG;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { projectId?: string; storageBucket?: string };
  } catch {
    return null;
  }
}

const hosted = hostedFirebaseConfig();

const projectId =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  hosted?.projectId;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET ??
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
  hosted?.storageBucket;

const hasServiceAccountKey = Boolean(clientEmail && privateKey);
const useApplicationDefault =
  !hasServiceAccountKey && (hosted !== null || process.env.FIREBASE_USE_ADC === "true");

export const isAdminConfigured = Boolean(
  projectId && (hasServiceAccountKey || useApplicationDefault),
);

let cachedApp: App | null = null;

function adminApp(): App {
  if (!isAdminConfigured) {
    throw new AdminNotConfiguredError();
  }
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length
    ? getApp()
    : initializeApp({
        credential: useApplicationDefault
          ? applicationDefault()
          : cert({ projectId, clientEmail, privateKey }),
        projectId,
        storageBucket,
      });
  return cachedApp;
}

export class AdminNotConfiguredError extends Error {
  readonly code = "admin-not-configured";
  constructor() {
    super(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local.",
    );
    this.name = "AdminNotConfiguredError";
  }
}

export function adminDb(): Firestore {
  const db = getFirestore(adminApp());
  return db;
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminStorage(): Storage {
  return getStorage(adminApp());
}

export function adminBucket() {
  return adminStorage().bucket(storageBucket);
}

/**
 * Runs a read against Firestore, returning `fallback` when Firebase has not
 * been configured yet. Used by public pages so the marketing site renders from
 * bundled defaults during local development.
 */
export async function readOrFallback<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  if (!isAdminConfigured) return fallback;
  try {
    return await read();
  } catch (error) {
    // During `next build` the build machine may not be allowed to read
    // Firestore. Fall back so the build succeeds; pages revalidate against the
    // live data once the server is running.
    const isBuilding = process.env.NEXT_PHASE === "phase-production-build";
    if (process.env.NODE_ENV !== "production" || isBuilding) {
      console.warn("[firestore] read failed, using fallback content:", error);
      return fallback;
    }
    throw error;
  }
}
