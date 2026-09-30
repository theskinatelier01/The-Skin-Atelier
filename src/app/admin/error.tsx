"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Admin error boundary.
 *
 * Admin pages are `force-dynamic` and read Firestore directly, so a failed read
 * or an expired session surfaces here. Staff need to know whether to retry or
 * to sign in again, not a blank screen mid-shift.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] render error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl text-ink">This screen failed to load.</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          The data could not be read. If this keeps happening after a retry, sign out and back in —
          your session may have expired.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={() => reset()} icon={<RotateCw className="size-4" />}>
            Try again
          </Button>
          <Link
            href="/admin"
            className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
          >
            Back to dashboard
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-ink-subtle">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
