import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/login-form";
import { getSettings } from "@/lib/cms/queries";

export const metadata: Metadata = {
  title: "Staff Sign In",
  // The sign-in page must never be indexed.
  robots: { index: false, follow: false, nocache: true },
};

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form */}
      <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="inline-block">
            <p className="font-display text-xl">{settings.clinicName}</p>
            <p className="mt-1 text-[0.5625rem] uppercase tracking-[0.32em] text-ink-subtle">
              Clinic Management
            </p>
          </Link>

          <h1 className="mt-14 font-display text-display-sm">Staff sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            This area is for clinic staff. Your access is limited to the permissions assigned to
            your role.
          </p>

          <div className="mt-10">
            <Suspense fallback={<div className="h-64 shimmer rounded-sm" />}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-10 text-xs leading-relaxed text-ink-subtle">
            All access to patient records is logged. If you have lost access to your account,
            contact your clinic administrator rather than creating a new one.
          </p>

          <Link
            href="/"
            className="link-reveal mt-8 inline-block text-sm text-ink-muted"
          >
            Return to the website
            <span className="link-reveal-line" />
          </Link>
        </div>
      </div>

      {/* Editorial panel */}
      <div className="relative hidden overflow-hidden bg-canvas-inverse lg:block">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-charcoal-800"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 30%, var(--color-champagne-400), transparent 55%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end p-16">
          <span className="rule-gold" aria-hidden="true" />
          <p className="mt-8 max-w-md font-display text-3xl leading-snug text-ivory-100">
            Where skin meets science.
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory-100/55">
            {settings.addressLine}, {settings.city}
          </p>
        </div>
      </div>
    </div>
  );
}
