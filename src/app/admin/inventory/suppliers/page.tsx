import { notFound } from "next/navigation";
import { Truck } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getSuppliers } from "@/lib/admin/queries";

export const metadata = { title: "Suppliers" };
export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "suppliers.read")) notFound();

  const suppliers = await getSuppliers();

  return (
    <>
      <AdminPageHeader
        title="Suppliers"
        description="Who the clinic buys from, with payment terms and tax details for purchase orders."
        breadcrumb={[{ label: "Inventory", href: "/admin" }, { label: "Suppliers" }]}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Suppliers" value={suppliers.length} icon={<Truck />} />
        <StatCard
          label="Active"
          value={suppliers.filter((s) => s.isActive).length}
          tone="positive"
        />
      </div>

      <div className="mt-5">
        <AdminSection title="All suppliers" description={`${suppliers.length} recorded`}>
          {suppliers.length === 0 ? (
            <EmptyState
              icon={<Truck />}
              title="No suppliers recorded"
              description="Add the suppliers the clinic orders consumables and retail stock from."
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Supplier</Th>
                    <Th>Contact</Th>
                    <Th>Phone</Th>
                    <Th>Email</Th>
                    <Th>Payment terms</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <Tr key={supplier.id}>
                      <Td>
                        <span className="font-medium">{supplier.name}</span>
                        {supplier.company && (
                          <span className="block text-xs text-ink-subtle">{supplier.company}</span>
                        )}
                      </Td>
                      <Td className="text-ink-muted">{supplier.contactPerson ?? "—"}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">{supplier.phone}</Td>
                      <Td className="text-ink-muted">{supplier.email ?? "—"}</Td>
                      <Td className="text-ink-muted">{supplier.paymentTerms ?? "—"}</Td>
                      <Td>
                        <Badge tone={supplier.isActive ? "success" : "neutral"} dot>
                          {supplier.isActive ? "Active" : "Inactive"}
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
