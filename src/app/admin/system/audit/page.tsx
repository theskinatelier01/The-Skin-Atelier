import { ScrollText, ShieldCheck } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { requirePermission } from "@/lib/auth/session";
import { getAuditLogs } from "@/lib/admin/queries";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { formatDateTime, formatRelative } from "@/lib/utils/format";

export const metadata = { title: "Audit Logs" };

const MODULES = ["Patients", "Appointments", "Finance", "Inventory", "Website", "Queue", "System"];

/**
 * Audit trail.
 *
 * Append-only by design: the Firestore rules deny update and delete on this
 * collection to every role, including a super admin, so the history cannot be
 * rewritten from inside the application.
 */
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  await requirePermission("auditLogs.read");

  const { module } = await searchParams;
  const logs = await getAuditLogs(200, module);

  return (
    <>
      <AdminPageHeader
        title="Audit Logs"
        description="Who changed what, and when. This record is append-only and cannot be edited or deleted by any role."
        breadcrumb={[{ label: "System", href: "/admin" }, { label: "Audit Logs" }]}
      />

      <div className="mb-5 flex gap-3 rounded-md border border-line-subtle bg-canvas-sunken p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-champagne-500" />
        <p className="text-xs leading-relaxed text-ink-muted">
          Sensitive values are redacted before a change is logged — clinical notes, allergies and
          image paths are recorded as changed without storing their contents, so the audit trail
          does not become a second copy of the medical record.
        </p>
      </div>

      <FilterTabs
        basePath="/admin/system/audit"
        param="module"
        current={module}
        options={MODULES}
        allLabel="All modules"
      />

      <div className="mt-5">
        <AdminSection title="Activity" description={`${logs.length} most recent entries`}>
          {logs.length === 0 ? (
            <EmptyState
              icon={<ScrollText />}
              title="No activity logged"
              description="Entries appear as staff create, edit and delete records."
            />
          ) : (
            <ul className="divide-y divide-line-subtle">
              {logs.map((log) => (
                <li key={log.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Badge tone="neutral">{log.module}</Badge>
                    <code className="font-mono text-xs text-ink">{log.action}</code>
                    {log.entityLabel && (
                      <span className="text-sm text-ink-muted">{log.entityLabel}</span>
                    )}
                    <span className="ml-auto whitespace-nowrap text-xs text-ink-subtle">
                      {formatRelative(log.at)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-ink-subtle">
                    {log.userName}
                    <span className="mx-1.5" aria-hidden="true">
                      ·
                    </span>
                    {ROLE_LABELS[log.userRole] ?? log.userRole}
                    <span className="mx-1.5" aria-hidden="true">
                      ·
                    </span>
                    {formatDateTime(log.at)}
                    {log.ip && (
                      <>
                        <span className="mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        {log.ip}
                      </>
                    )}
                  </p>

                  {(log.before || log.after) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
                        View change
                      </summary>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <ChangePanel label="Before" data={log.before} />
                        <ChangePanel label="After" data={log.after} />
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AdminSection>
      </div>
    </>
  );
}

function ChangePanel({
  label,
  data,
}: {
  label: string;
  data?: Record<string, unknown> | null;
}) {
  return (
    <div className="rounded-sm border border-line-subtle bg-canvas p-3">
      <p className="text-[0.625rem] uppercase tracking-[0.14em] text-ink-subtle">{label}</p>
      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[0.6875rem] leading-relaxed text-ink-muted">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </div>
  );
}
