import { PermissionError } from "@/lib/auth/permissions";

/**
 * Shared result shape for server actions.
 *
 * Lives outside any `"use server"` module because those may only export async
 * functions — a synchronous helper or a value export there is a build error.
 */
export interface ActionResult {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
}

/**
 * Maps a thrown error onto a result the form can render.
 *
 * Internal details are logged server-side and never returned to the browser:
 * an authorisation failure and a Firestore failure look different in the logs
 * but both produce a plain sentence for the user.
 */
export function toActionResult(error: unknown, fallback: string): ActionResult {
  if (error instanceof PermissionError) {
    return { ok: false, message: "You do not have permission to do that." };
  }
  if ((error as { code?: string })?.code === "unauthenticated") {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }
  console.error("[action]", error);
  return { ok: false, message: fallback };
}
