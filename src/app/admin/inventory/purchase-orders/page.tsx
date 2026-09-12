import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import {
  AdminPageHeader,
  AdminSection,
  PurchaseOrderStatusBadge,
  StatCard,
} from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getPurchaseOrders } from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata = { title: "Purchase Orders" };
export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "purchaseOrders.read")) notFound();

  const [orders, settings] = await Promise.all([getPurchaseOrders(100), getSettings()]);
  const open = orders.filter((o) => ["Draft", "Ordered", "Partially Received"].includes(o.status));
  const committed = open.reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <AdminPageHeader
        title="Purchase Orders"
        description="Orders placed with suppliers. Receiving an order creates the batches and the stock movements automatically."
        breadcrumb={[{ label: "Inventory", href: "/admin" }, { label: "Purchase Orders" }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Orders" value={orders.length} icon={<ClipboardList />} />
        <StatCard label="Open" value={open.length} tone={open.length > 0 ? "warning" : "neutral"} />
        <StatCard
          label="Committed spend"
          value={formatCurrency(committed, settings.currencySymbol, { compact: true })}
          hint="On open orders"
        />
      </div>

      <div className="mt-5">
        <AdminSection title="All purchase orders" description={`${orders.length} recorded`}>
          {orders.length === 0 ? (
            <EmptyState
              icon={<ClipboardList />}
              title="No purchase orders"
              description="Raise an order when restocking so deliveries can be checked against what was ordered."
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>PO number</Th>
                    <Th>Supplier</Th>
                    <Th>Ordered</Th>
                    <Th>Expected</Th>
                    <Th align="right">Items</Th>
                    <Th align="right">Total</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <Tr key={order.id}>
                      <Td className="font-mono text-xs font-medium">{order.poNumber}</Td>
                      <Td>{order.supplierName}</Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(order.orderDate)}
                      </Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : "—"}
                      </Td>
                      <Td align="right">{order.items.length}</Td>
                      <Td align="right">
                        {formatCurrency(order.total, settings.currencySymbol)}
                      </Td>
                      <Td>
                        <PurchaseOrderStatusBadge status={order.status} />
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
