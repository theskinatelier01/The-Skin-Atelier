import { Check, Minus, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { requirePermission } from "@/lib/auth/session";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  permissionsForRole,
} from "@/lib/auth/permissions";

export const metadata = { title: "Roles & Permissions" };

/**
 * Role matrix.
 *
 * Rendered directly from the permission module that the server actions enforce,
 * so this screen cannot drift from the behaviour it documents. Editing the
 * matrix means editing `lib/auth/permissions.ts` and deploying — deliberately,
 * because a permission model that can be changed at runtime by whoever is
 * signed in is not much of a permission model.
 */
export default async function RolesPage() {
  await requirePermission("roles.write");

  // Group by the first segment of the permission key: cms, patients, invoices…
  const groups = ALL_PERMISSIONS.reduce<Record<string, typeof ALL_PERMISSIONS>>((acc, p) => {
    const key = p.split(".")[0];
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  const matrix = Object.fromEntries(
    ROLES.map((role) => [role, new Set(permissionsForRole(role))]),
  );

  return (
    <>
      <AdminPageHeader
        title="Roles & Permissions"
        description="The complete authorisation matrix. Every server action checks these before it writes, and the Firestore rules check the role claim again."
        breadcrumb={[{ label: "System", href: "/admin" }, { label: "Roles" }]}
      />

      <div className="mb-5 flex gap-3 rounded-md border border-line-subtle bg-canvas-sunken p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-champagne-500" />
        <p className="text-xs leading-relaxed text-ink-muted">
          Hiding a menu item is a convenience, never the control. Permissions are enforced on the
          server in every action, and again in the database rules, so an unauthorised request fails
          even if the interface is bypassed entirely. Individual users can be granted or denied
          single permissions on top of their role from the Users screen.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => (
          <div key={role} className="rounded-md border border-line-subtle bg-canvas-raised p-4">
            <p className="text-sm font-semibold text-ink">{ROLE_LABELS[role]}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              {ROLE_DESCRIPTIONS[role]}
            </p>
            <Badge tone={role === "SUPER_ADMIN" ? "accent" : "neutral"} className="mt-3">
              {matrix[role].size} permissions
            </Badge>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {Object.entries(groups).map(([group, permissions]) => (
          <AdminSection key={group} title={groupLabel(group)} description={`${permissions.length} permissions`}>
            <div
              className="w-full overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label={`${groupLabel(group)} permission matrix`}
            >
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 z-10 min-w-64 border-b border-line bg-canvas-sunken px-4 py-3 text-left text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-ink-muted"
                    >
                      Permission
                    </th>
                    {ROLES.map((role) => (
                      <th
                        key={role}
                        scope="col"
                        className="border-b border-line bg-canvas-sunken px-2 py-3 text-center text-[0.5625rem] font-semibold uppercase tracking-[0.08em] text-ink-muted"
                      >
                        {/* Abbreviated so eight roles fit without a horizontal scroll on desktop. */}
                        {abbreviate(ROLE_LABELS[role])}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr key={permission} className="hover:bg-canvas-sunken/50">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 border-b border-line-subtle bg-canvas-raised px-4 py-2.5 text-left font-normal"
                      >
                        <span className="block text-[0.8125rem] text-ink">
                          {PERMISSIONS[permission]}
                        </span>
                        <code className="mt-0.5 block font-mono text-[0.625rem] text-ink-subtle">
                          {permission}
                        </code>
                      </th>
                      {ROLES.map((role) => {
                        const granted = matrix[role].has(permission);
                        return (
                          <td
                            key={role}
                            className="border-b border-line-subtle px-2 py-2.5 text-center"
                          >
                            {granted ? (
                              <>
                                <Check
                                  aria-hidden="true"
                                  className="mx-auto size-3.5 text-success"
                                />
                                <span className="sr-only">
                                  {ROLE_LABELS[role]} has {PERMISSIONS[permission]}
                                </span>
                              </>
                            ) : (
                              <>
                                <Minus
                                  aria-hidden="true"
                                  className="mx-auto size-3 text-line-strong"
                                />
                                <span className="sr-only">
                                  {ROLE_LABELS[role]} does not have {PERMISSIONS[permission]}
                                </span>
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminSection>
        ))}
      </div>
    </>
  );
}

const GROUP_LABELS: Record<string, string> = {
  cms: "Website & CMS",
  patients: "Patients",
  appointments: "Appointments",
  queue: "Waiting Queue",
  consultations: "Consultations",
  treatments: "Treatments",
  leads: "Leads",
  pos: "Point of Sale",
  invoices: "Invoices",
  payments: "Payments",
  expenses: "Expenses",
  finance: "Finance",
  packages: "Packages",
  inventory: "Inventory",
  suppliers: "Suppliers",
  purchaseOrders: "Purchase Orders",
  staff: "Staff",
  doctors: "Doctors",
  schedules: "Schedules",
  users: "Users",
  roles: "Roles",
  auditLogs: "Audit Logs",
  settings: "Settings",
  notifications: "Notifications",
  reports: "Reports",
};

function groupLabel(key: string) {
  return GROUP_LABELS[key] ?? key;
}

/** "Inventory Manager" -> "Inv Mgr" so the matrix header stays compact. */
function abbreviate(label: string) {
  return label
    .split(" ")
    .map((word) => (word.length > 5 ? `${word.slice(0, 3)}.` : word))
    .join(" ");
}
