"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Public-site error boundary.
 *
 * Without this, any error thrown below the site layout — most commonly a
 * `ChunkLoadError` when cached HTML asks for a script a later deploy removed —
 * unwinds all the way to the root and the visitor gets Next's bare
 * "Application error" text. On a booking page that reads as a broken clinic, so
 * the recovery path and the phone number both have to be on screen.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] render error", error);
  }, [error]);

  // A stale document asking for a deleted bundle cannot be fixed by re-rendering
  // the same tree — it needs a fresh document from the server.
  const isStaleBundle =
    error.name === "ChunkLoadError" || /Loading chunk|dynamically imported module/i.test(error.message);

  return (
    <div className="container-editorial section-y">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-4 font-display text-display-sm">
          {isStaleBundle ? "This page needs reloading." : "We could not load this page."}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-muted">
          {isStaleBundle
            ? "The site has been updated since this page was opened. Reloading will pick up the new version."
            : "This is a fault on our side, not anything you did. Reloading usually resolves it."}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            onClick={() => (isStaleBundle ? window.location.reload() : reset())}
            icon={<RotateCw className="size-4" />}
          >
            Reload the page
          </Button>
          <ButtonLink href="/" variant="outline">
            Back to home
          </ButtonLink>
        </div>

        <p className="mt-10 text-sm leading-relaxed text-ink-muted">
          If you were trying to book, please call{" "}
          <a href="tel:+923375977799" className="link-reveal font-medium text-ink">
            0337 5977799
            <span className="link-reveal-line" />
          </a>{" "}
          or{" "}
          <a
            href="https://wa.me/923375977799"
            target="_blank"
            rel="noopener noreferrer"
            className="link-reveal font-medium text-ink"
          >
            message us on WhatsApp
            <span className="link-reveal-line" />
          </a>
          . We will book you in directly.
        </p>

        {error.digest && (
          <p className="mt-8 text-xs text-ink-subtle">Reference: {error.digest}</p>
        )}

        <p className="mt-4 text-xs text-ink-subtle">
          <Link href="/contact" className="underline underline-offset-2">
            Other ways to reach us
          </Link>
        </p>
      </div>
    </div>
  );
}
