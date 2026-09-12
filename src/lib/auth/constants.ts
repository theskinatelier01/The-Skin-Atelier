/**
 * Edge-safe auth constants.
 *
 * Kept in their own module with no imports: `middleware.ts` runs on the edge
 * runtime and cannot bundle the Firebase Admin SDK, so it must not reach into
 * `session.ts` for these values.
 */

export const SESSION_COOKIE = "__sa_session";

/** 5 days — the maximum lifetime Firebase will mint a session cookie for. */
export const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 5 * 1000;
