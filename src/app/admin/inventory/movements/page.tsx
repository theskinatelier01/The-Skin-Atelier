import { notFound } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, ScrollText } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getStockMovements } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/utils/format";

export const metadata = { title: "Stock Movements" };
export const dynamic = "force-dynamic";

const TONE: Record<string, "success" | "danger" | "warning" | "neutral" | "info"> = {
  STOCK_IN: "success",
  RETURN: "success",
  STOCK_OUT: "warning",
  SALE: "info",
  TREATMENT_USE: "info",
  ADJUSTMENT: "neutral",
  TRANSFER: "neutral",
  EXPIRED: "danger",
  DAMAGED: "danger",
  WASTAGE: "danger",
};

/**
 * The stock ledger.
 *
 * Append-only: corrections are new entries, never edits. That is what makes a
 * discrepancy traceable to the movement and the person that caused it.
 */
export default async function StockMovementsPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "inventory.read")) notFound();

  const movements = await getStockMovements(200);

  return (
    <>
      <AdminPageHeader
        title="Stock Movements"
        description="Every change to stock, in order. This ledger is append-only and cannot be edited."
        breadcrumb={[{ label: "Inventory", href: "/admin" }, { label: "Stock Movements" }]}
      />

      <AdminSection title="Ledger" description={`${movements.length} most recent entries`}>
        {movements.length === 0 ? (
          <EmptyState
            icon={<ScrollText />}
            title="No movements recorded"
            description="Receiving a batch, selling a product or recording a treatment all create entries here."
          />
        ) : (
          <TableWrap className="rounded-none border-0">
            <Table>
              <thead>
                <tr>
                  <Th>When</Th>
                  <Th>Product</Th>
                  <Th>Type</Th>
                  <Th>Batch</Th>
                  <Th align="right">Change</Th>
                  <Th align="right">Balance</Th>
                  <Th>Reason</Th>
                  <Th>By</Th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <Tr key={movement.id}>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {formatDateTime(movement.createdAt)}
                    </Td>
                    <Td className="font-medium">{movement.productName}</Td>
                    <Td>
                      <Badge tone={TONE[movement.type] ?? "neutral"}>
                        {movement.type.replace(/_/g, " ")}
                      </Badge>
                    </Td>
                    <Td className="font-mono text-xs text-ink-subtle">
                      {movement.batchNumber ?? "—"}
                    </Td>
                    <Td
                      align="right"
                      className={movement.quantity < 0 ? "text-danger" : "text-success"}
                    >
                      <span className="inline-flex items-center gap-1">
                        {movement.quantity < 0 ? (
                          <ArrowDownLeft className="size-3" aria-hidden="true" />
                        ) : (
                          <ArrowUpRight className="size-3" aria-hidden="true" />
                        )}
                        {movement.quantity > 0 ? "+" : ""}
                        {movement.quantity} {movement.unit}
                      </span>
                    </Td>
                    <Td align="right">{movement.balanceAfter}</Td>
                    <Td className="max-w-xs truncate text-ink-muted">
                      {movement.reason ?? movement.reference ?? "—"}
                    </Td>
                    <Td className="truncate text-xs text-ink-subtle">
                      {movement.performedByName}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </AdminSection>
    </>
  );
}
