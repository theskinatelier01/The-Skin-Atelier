import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission, ROLE_LABELS } from "@/lib/auth/permissions";
import { getStaff } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Staff" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "staff.read")) notFound();

  const staff = await getStaff();
  const active = staff.filter((s) => s.isActive);

  return (
    <>
      <AdminPageHeader
        title="Staff"
        description="Everyone who works at the clinic. A staff record is the person; a user account is their login."
        breadcrumb={[{ label: "Staff", href: "/admin" }, { label: "Directory" }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total staff" value={staff.length} icon={<Users />} />
        <StatCard label="Active" value={active.length} tone="positive" />
        <StatCard
          label="Departments"
          value={new Set(staff.map((s) => s.department)).size}
        />
      </div>

      <div className="mt-5">
        <AdminSection title="Directory" description={`${staff.length} people`}>
          {staff.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title="No staff recorded"
              description="Add the clinic team so appointments, commissions and schedules can be assigned."
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Role</Th>
                    <Th>Department</Th>
                    <Th>Phone</Th>
                    <Th>Joined</Th>
                    <Th align="right">Commission</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <Tr key={member.id}>
                      <Td className="font-medium">{member.fullName}</Td>
                      <Td>
                        <Badge tone="neutral">{ROLE_LABELS[member.role] ?? member.role}</Badge>
                      </Td>
                      <Td className="text-ink-muted">{member.department}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">{member.phone}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(member.joiningDate)}
                      </Td>
                      <Td align="right" className="text-ink-muted">
                        {member.commissionPercent ? `${member.commissionPercent}%` : "—"}
                      </Td>
                      <Td>
                        <Badge tone={member.isActive ? "success" : "neutral"} dot>
                          {member.isActive ? "Active" : "Inactive"}
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
