import { notFound } from "next/navigation";

import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { requirePermission } from "@/lib/auth/session";
import { getBatches, getProduct, getStockMovements, getSuppliers } from "@/lib/admin/queries";
import { DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";
import { formatDate, formatDateTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product?.name ?? "Product" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("inventory.read");

  const { id } = await params;
  const [product, suppliers, batches, movements] = await Promise.all([
    getProduct(id),
    getSuppliers(),
    getBatches(id),
    getStockMovements(40, id),
  ]);

  if (!product) notFound();

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={`${product.sku} · ${product.currentStock} ${product.unit} in stock`}
        breadcrumb={[
          { label: "Inventory", href: "/admin" },
          { label: "Products", href: "/admin/inventory/products" },
          { label: product.name },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ProductForm product={product} suppliers={suppliers} branchId={DEFAULT_BRANCH_ID} />
        </div>

        <div className="space-y-5 xl:col-span-2">
          <AdminSection title="Batches" description={`${batches.length} recorded`}>
            {batches.length === 0 ? (
              <EmptyState title="No batches" description="Record a batch when stock arrives." />
            ) : (
              <ul className="divide-y divide-line-subtle">
                {batches.map((batch) => (
                  <li key={batch.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-ink">{batch.batchNumber}</p>
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        Expires {formatDate(batch.expiryDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm tabular-nums text-ink">
                        {batch.quantityRemaining}/{batch.quantityReceived}
                      </span>
                      <Badge tone={batch.status === "Active" ? "success" : "neutral"}>
                        {batch.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminSection>

          <AdminSection title="Recent movements" description={`${movements.length} entries`}>
            {movements.length === 0 ? (
              <EmptyState title="No movements yet" />
            ) : (
              <TableWrap className="rounded-none border-0">
                <Table>
                  <thead>
                    <tr>
                      <Th>When</Th>
                      <Th>Type</Th>
                      <Th align="right">Change</Th>
                      <Th align="right">Balance</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((movement) => (
                      <Tr key={movement.id}>
                        <Td className="whitespace-nowrap text-xs text-ink-muted">
                          {formatDateTime(movement.createdAt)}
                        </Td>
                        <Td className="text-xs">{movement.type.replace(/_/g, " ")}</Td>
                        <Td
                          align="right"
                          className={movement.quantity < 0 ? "text-danger" : "text-success"}
                        >
                          {movement.quantity > 0 ? "+" : ""}
                          {movement.quantity}
                        </Td>
                        <Td align="right">{movement.balanceAfter}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </AdminSection>
        </div>
      </div>
    </>
  );
}
