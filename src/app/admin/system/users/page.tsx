import { notFound } from "next/navigation";
import { KeyRound, ShieldCheck, UserCog } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission, permissionsForRole, ROLE_LABELS } from "@/lib/auth/permissions";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import { fromSnapshot } from "@/lib/firebase/convert";
import { formatRelative } from "@/lib/utils/format";
import type { AppUser } from "@/types";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

async function listUsers(): Promise<AppUser[]> {
  if (!isAdminConfigured) return [];
  try {
    const snap = await adminDb().collection(C.users).orderBy("displayName").limit(200).get();
    return snap.docs.map((doc) => fromSnapshot<AppUser>(doc));
  } catch {
    return [];
  }
}

/**
 * System users.
 *
 * A user is a login; a staff member is a person. They are linked but separate,
 * so a clinician can leave without their historic records losing their author,
 * and a locum can be given access without a permanent staff record.
 */
export default async function UsersPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "users.read")) notFound();

  const users = await listUsers();

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Accounts that can sign in to the clinic system. Roles are assigned here and mirrored into the database security rules."
        breadcrumb={[{ label: "System", href: "/admin" }, { label: "Users" }]}
      />

      <div className="mb-5 flex gap-3 rounded-md border border-line-subtle bg-canvas-sunken p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-champagne-500" />
        <p className="text-xs leading-relaxed text-ink-muted">
          Changing a role updates the account custom claim, which is what the Firestore and Storage
          rules read. The change takes effect the next time the user signs in, so revoke access by
          deactivating the account rather than only lowering the role.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Accounts" value={users.length} icon={<UserCog />} />
        <StatCard
          label="Active"
          value={users.filter((u) => u.isActive).length}
          tone="positive"
        />
        <StatCard
          label="Super admins"
          value={users.filter((u) => u.role === "SUPER_ADMIN").length}
          hint="Keep this number small"
          tone={users.filter((u) => u.role === "SUPER_ADMIN").length > 2 ? "warning" : "neutral"}
          icon={<KeyRound />}
        />
      </div>

      <div className="mt-5">
        <AdminSection title="All accounts" description={`${users.length} users`}>
          {users.length === 0 ? (
            <EmptyState
              icon={<UserCog />}
              title="No user accounts"
              description="Run the seed script to create the first super admin, then invite colleagues from here."
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th align="right">Permissions</Th>
                    <Th>Last signed in</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <Tr key={user.id}>
                      <Td className="font-medium">{user.displayName}</Td>
                      <Td className="text-ink-muted">{user.email}</Td>
                      <Td>
                        <Badge tone={user.role === "SUPER_ADMIN" ? "accent" : "neutral"}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </Td>
                      <Td align="right" className="text-ink-muted">
                        {permissionsForRole(user.role).length}
                        {user.extraPermissions?.length ? ` +${user.extraPermissions.length}` : ""}
                        {user.deniedPermissions?.length ? ` −${user.deniedPermissions.length}` : ""}
                      </Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Never"}
                      </Td>
                      <Td>
                        <Badge tone={user.isActive ? "success" : "danger"} dot>
                          {user.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </AdminSection>
      </div>
    </>
  );
}
