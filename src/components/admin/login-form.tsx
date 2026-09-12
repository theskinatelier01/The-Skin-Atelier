"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { getClientAuth, isFirebaseConfigured } from "@/lib/firebase/client";

/**
 * Staff sign-in.
 *
 * Signs in with the Firebase client SDK, then trades the ID token for an
 * httpOnly session cookie. The client SDK session is signed out immediately
 * afterwards so the browser never holds a long-lived credential in JS-readable
 * storage — the cookie is the only thing that persists.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isFirebaseConfigured) {
      setError(
        "Firebase is not configured. Copy .env.example to .env.local and add your project credentials.",
      );
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setPending(true);
    try {
      const { signInWithEmailAndPassword, signOut } = await import("firebase/auth");
      const auth = getClientAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);

      // Force a refresh so any custom claim set on a previous sign-in is present.
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        await signOut(auth);
        setError(body.error ?? "Sign-in could not be completed.");
        return;
      }

      await signOut(auth);

      router.replace(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="flex gap-2.5 rounded-sm border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <Input
        name="email"
        type="email"
        label="Work email"
        required
        autoComplete="username"
        autoFocus
        placeholder="you@theskinatelier.pk"
      />

      <Input
        name="password"
        type="password"
        label="Password"
        required
        autoComplete="current-password"
      />

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

/**
 * Firebase error codes are not user-facing copy. Note that wrong-password and
 * unknown-user deliberately produce the same message, so the form cannot be
 * used to enumerate which email addresses exist.
 */
function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "That email and password combination was not recognised.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact your clinic administrator.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Sign-in failed. Please try again, or contact your administrator.";
  }
}
