import { notFound } from "next/navigation";
import { Boxes } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getBatches } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Batches" };
export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "inventory.read")) notFound();

  const batches = await getBatches();
  const active = batches.filter((b) => b.quantityRemaining > 0);

  return (
    <>
      <AdminPageHeader
        title="Batches"
        description="Batch and expiry tracking for every consumable. Listed in expiry order, which is the order they are consumed in."
        breadcrumb={[{ label: "Inventory", href: "/admin" }, { label: "Batches" }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Batches tracked" value={batches.length} icon={<Boxes />} />
        <StatCard label="With stock remaining" value={active.length} tone="positive" />
        <StatCard
          label="Depleted"
          value={batches.filter((b) => b.quantityRemaining <= 0).length}
        />
      </div>

      <div className="mt-5">
        <AdminSection title="All batches" description={`${batches.length} recorded`}>
          {batches.length === 0 ? (
            <EmptyState
              icon={<Boxes />}
              title="No batches recorded"
              description="Record a batch when stock is received so expiry can be tracked and consumed under FEFO."
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>Batch number</Th>
                    <Th align="right">Received</Th>
                    <Th align="right">Remaining</Th>
                    <Th>Purchased</Th>
                    <Th>Expires</Th>
                    <Th>Supplier</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <Tr key={batch.id}>
                      <Td className="font-medium">{batch.productName}</Td>
                      <Td className="font-mono text-xs text-ink-subtle">{batch.batchNumber}</Td>
                      <Td align="right" className="text-ink-muted">
                        {batch.quantityReceived}
                      </Td>
                      <Td align="right">{batch.quantityRemaining}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(batch.purchaseDate)}
                      </Td>
                      <Td className="whitespace-nowrap">{formatDate(batch.expiryDate)}</Td>
                      <Td className="text-ink-muted">{batch.supplierName ?? "—"}</Td>
                      <Td>
                        <Badge
                          tone={
                            batch.status === "Active"
                              ? "success"
                              : batch.status === "Expired"
                                ? "danger"
                                : "neutral"
                          }
                          dot
                        >
                          {batch.status}
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
