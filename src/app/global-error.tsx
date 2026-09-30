"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary.
 *
 * This replaces the root layout entirely, so it cannot use the site's fonts,
 * theme tokens or components — none of them are guaranteed to have loaded if
 * the failure happened this high up. Everything here is inline and self
 * contained on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] render error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "#faf8f5",
          color: "#1c1a17",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          lineHeight: 1.6,
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8a8175",
            }}
          >
            The Skin Atelier
          </p>
          <h1 style={{ margin: "1rem 0 0", fontSize: "1.75rem", fontWeight: 500 }}>
            This page needs reloading.
          </h1>
          <p style={{ margin: "1rem 0 0", fontSize: "0.9375rem", color: "#5c564e" }}>
            Something went wrong while loading the site. Reloading usually resolves it.
          </p>

          <button
            onClick={() => reset()}
            style={{
              marginTop: "2rem",
              minHeight: "3rem",
              padding: "0 2rem",
              border: "none",
              borderRadius: "2px",
              background: "#1c1a17",
              color: "#faf8f5",
              fontSize: "0.875rem",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Reload the page
          </button>

          <p style={{ margin: "2.5rem 0 0", fontSize: "0.9375rem", color: "#5c564e" }}>
            To book, call{" "}
            <a href="tel:+923375977799" style={{ color: "#1c1a17", fontWeight: 500 }}>
              0337 5977799
            </a>{" "}
            or{" "}
            <a
              href="https://wa.me/923375977799"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1c1a17", fontWeight: 500 }}
            >
              message us on WhatsApp
            </a>
            .
          </p>

          {error.digest && (
            <p style={{ margin: "2rem 0 0", fontSize: "0.75rem", color: "#8a8175" }}>
              Reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
