import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { getAuthContext } from "@/lib/auth/session";
import { getSidebarBadges, getUnreadNotificationCount } from "@/lib/admin/badges";
import { getSettings } from "@/lib/cms/queries";
import { isAdminConfigured } from "@/lib/firebase/admin";

export const metadata: Metadata = {
  title: { default: "Clinic Management", template: "%s · Clinic Management" },
  robots: { index: false, follow: false, nocache: true },
};

// The admin is always live data — never cached or statically rendered.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Setup guard: without server credentials there is no way to verify anyone,
  // so we show instructions instead of an infinite redirect to /login.
  if (!isAdminConfigured) return <SetupRequired />;

  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const [settings, badges, unread] = await Promise.all([
    getSettings(),
    getSidebarBadges(ctx),
    getUnreadNotificationCount(ctx),
  ]);

  return (
    <div className="min-h-screen bg-canvas">
      <AdminSidebar ctx={ctx} badges={badges} clinicName={settings.clinicName} />

      <div className="lg:pl-[17rem]">
        <AdminTopbar unreadCount={unread} branchName={`${settings.city} · F-11`} />
        <div className="px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </div>
    </div>
  );
}

function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="flex gap-4 rounded-md border border-warning/25 bg-warning-bg p-6">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <h1 className="font-display text-xl text-ink">Firebase is not configured</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              The clinic management system needs server credentials before anyone can sign in. The
              public website runs without them, using the bundled demo content.
            </p>

            <ol className="mt-6 space-y-3 text-sm text-ink-muted">
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-champagne-500">
                  01
                </span>
                <span>
                  Copy <code className="rounded-xs bg-canvas-sunken px-1.5 py-0.5 text-xs">.env.example</code> to{" "}
                  <code className="rounded-xs bg-canvas-sunken px-1.5 py-0.5 text-xs">.env.local</code>.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-champagne-500">
                  02
                </span>
                <span>
                  Fill in the Firebase web config and a service account key from the Firebase
                  console.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-champagne-500">
                  03
                </span>
                <span>
                  Run <code className="rounded-xs bg-canvas-sunken px-1.5 py-0.5 text-xs">npm run seed</code>{" "}
                  to create the collections, demo data and your first super admin.
                </span>
              </li>
            </ol>

            <p className="mt-6 text-xs text-ink-subtle">
              Full instructions are in <code>README.md</code>.
            </p>

            <Link href="/" className="link-reveal mt-6 inline-block text-sm text-ink">
              Back to the website
              <span className="link-reveal-line" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
