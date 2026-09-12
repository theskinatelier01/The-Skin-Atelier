import "server-only";

import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
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
 */

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

export const isAdminConfigured = Boolean(projectId && clientEmail && privateKey);

let cachedApp: App | null = null;

function adminApp(): App {
  if (!isAdminConfigured) {
    throw new AdminNotConfiguredError();
  }
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
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
    if (process.env.NODE_ENV !== "production") {
      console.warn("[firestore] read failed, using fallback content:", error);
      return fallback;
    }
    throw error;
  }
}
