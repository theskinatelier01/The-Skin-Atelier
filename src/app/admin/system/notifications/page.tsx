import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getNotifications } from "@/lib/admin/queries";
import { formatRelative } from "@/lib/utils/format";
import type { AppNotification } from "@/types";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const SEVERITY_TONE = { info: "info", warning: "warning", critical: "danger" } as const;

export default async function NotificationsPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "notifications.read")) notFound();

  const notifications = (await getNotifications(ctx.role, 100)) as AppNotification[];
  const unread = notifications.filter((n) => !n.readBy?.includes(ctx.uid));

  return (
    <>
      <AdminPageHeader
        title="Notifications"
        description="Alerts raised for your role: new bookings, low stock, expiring products, unpaid invoices and follow-ups due."
        breadcrumb={[{ label: "System", href: "/admin" }, { label: "Notifications" }]}
      />

      <AdminSection
        title="Recent"
        description={`${notifications.length} notifications · ${unread.length} unread`}
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell />}
            title="Nothing to report"
            description="Notifications appear here when something needs attention."
          />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {notifications.map((notification) => {
              const isUnread = !notification.readBy?.includes(ctx.uid);
              const body = (
                <div className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className={
                      isUnread
                        ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-champagne-400"
                        : "mt-1.5 size-1.5 shrink-0 rounded-full bg-transparent"
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={
                          isUnread
                            ? "text-sm font-medium text-ink"
                            : "text-sm text-ink-muted"
                        }
                      >
                        {notification.title}
                      </p>
                      <Badge tone={SEVERITY_TONE[notification.severity] ?? "neutral"}>
                        {notification.type.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{notification.body}</p>
                    <p className="mt-1 text-xs text-ink-subtle">
                      {formatRelative(notification.createdAt)}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={notification.id} className="px-5 py-3.5">
                  {notification.href ? (
                    <Link href={notification.href} className="block transition-opacity hover:opacity-80">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </AdminSection>
    </>
  );
}
