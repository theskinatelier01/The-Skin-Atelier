import { Users } from "lucide-react";

import { EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection, QueueStatusBadge, StatCard } from "@/components/admin/admin-ui";
import { QueueActions } from "@/components/admin/queue-actions";
import { requirePermission } from "@/lib/auth/session";
import { getQueue } from "@/lib/admin/queries";
import { formatRelative, formatTime } from "@/lib/utils/format";
import type { QueueStatus } from "@/types";

export const metadata = { title: "Waiting Queue" };

// The queue is the most volatile screen in the clinic, so it is never cached.
export const revalidate = 0;

const COLUMNS: { status: QueueStatus; title: string; hint: string }[] = [
  { status: "WAITING", title: "Waiting", hint: "Checked in, not yet called" },
  { status: "CALLED", title: "Called", hint: "Called through to a room" },
  { status: "WITH DOCTOR", title: "With doctor", hint: "In consultation" },
  { status: "TREATMENT", title: "In treatment", hint: "Receiving treatment" },
];

export default async function QueuePage() {
  await requirePermission("queue.manage");

  const queue = await getQueue();
  const active = queue.filter((q) => q.status !== "COMPLETED");

  const longestWait = active
    .filter((q) => q.status === "WAITING")
    .map((q) => new Date(q.checkedInAt).getTime())
    .sort((a, b) => a - b)[0];

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Waiting Queue"
        description="Live board of everyone currently in the clinic. Advancing a patient here updates their appointment too."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Waiting Queue" }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="In the clinic" value={active.length} icon={<Users />} />
        <StatCard
          label="Waiting"
          value={active.filter((q) => q.status === "WAITING").length}
          tone={active.filter((q) => q.status === "WAITING").length > 3 ? "warning" : "neutral"}
        />
        <StatCard
          label="Longest wait"
          value={longestWait ? formatRelative(new Date(longestWait).toISOString()).replace("about ", "") : "—"}
          hint="Since check-in"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const entries = active
            .filter((q) => q.status === column.status)
            .sort((a, b) => a.token - b.token);

          return (
            <AdminSection
              key={column.status}
              title={column.title}
              description={`${entries.length} · ${column.hint}`}
            >
              {entries.length === 0 ? (
                <p className="px-5 py-10 text-center text-xs text-ink-subtle">Empty</p>
              ) : (
                <ul className="divide-y divide-line-subtle">
                  {entries.map((entry) => (
                    <li key={entry.id} className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="grid size-8 shrink-0 place-items-center rounded-full bg-canvas-sunken font-display text-sm tabular-nums"
                        >
                          {entry.token}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {entry.patientName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-ink-subtle">
                            {entry.serviceName ?? "Consultation"}
                          </p>
                          {entry.doctorName && (
                            <p className="mt-0.5 truncate text-xs text-ink-subtle">
                              {entry.doctorName}
                            </p>
                          )}
                          <p className="mt-1.5 text-xs text-ink-subtle">
                            In at {formatTime(new Date(entry.checkedInAt).toTimeString().slice(0, 5))}
                            {" · "}
                            {formatRelative(entry.checkedInAt)}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            <QueueStatusBadge status={entry.status} />
                            <QueueActions entry={entry} />
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminSection>
          );
        })}
      </div>

      {active.length === 0 && (
        <div className="mt-6">
          <AdminSection title="Queue">
            <EmptyState
              icon={<Users />}
              title="Nobody is waiting"
              description="Patients appear on this board as soon as they are checked in at the front desk."
            />
          </AdminSection>
        </div>
      )}
    </>
  );
}
