import Link from "next/link";
import { AlertTriangle, Package, Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { StockAdjustButton } from "@/components/admin/stock-adjust-button";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getProducts } from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { INVENTORY_CATEGORIES } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { notFound } from "next/navigation";

export const metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; filter?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "inventory.read")) notFound();

  const { category, filter } = await searchParams;
  const [all, settings] = await Promise.all([getProducts(), getSettings()]);

  let products = all;
  if (category) products = products.filter((p) => p.category === category);
  if (filter === "low") products = products.filter((p) => p.currentStock <= p.minimumStock);
  if (filter === "retail") products = products.filter((p) => p.isRetail);

  const stockValue = all.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const lowCount = all.filter((p) => p.currentStock <= p.minimumStock).length;
  const outCount = all.filter((p) => p.currentStock <= 0).length;

  const canWrite = hasPermission(ctx, "inventory.write");

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Clinical consumables and retail stock. Stock levels move only through the movement ledger, never by direct edit."
        breadcrumb={[{ label: "Inventory", href: "/admin" }, { label: "Products" }]}
        actions={
          canWrite ? (
            <ButtonLink href="/admin/inventory/products/new" icon={<Plus />}>
              New product
            </ButtonLink>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Products" value={all.length} icon={<Package />} />
        <StatCard
          label="Stock value"
          value={formatCurrency(stockValue, settings.currencySymbol, { compact: true })}
          hint="At purchase price"
        />
        <StatCard
          label="Low stock"
          value={lowCount}
          tone={lowCount > 0 ? "warning" : "positive"}
          href="/admin/inventory/products?filter=low"
          icon={<AlertTriangle />}
        />
        <StatCard label="Out of stock" value={outCount} tone={outCount > 0 ? "critical" : "positive"} />
      </div>

      <div className="mt-5 space-y-2">
        <FilterTabs
          basePath="/admin/inventory/products"
          param="filter"
          current={filter}
          options={["low", "retail"]}
          allLabel="All products"
        />
        <FilterTabs
          basePath="/admin/inventory/products"
          param="category"
          current={category}
          options={[...INVENTORY_CATEGORIES]}
          allLabel="All categories"
        />
      </div>

      <div className="mt-5">
        <AdminSection title="Inventory" description={`${products.length} of ${all.length} shown`}>
          {products.length === 0 ? (
            <EmptyState
              icon={<Package />}
              title="No products"
              description="Add the clinic's consumables and retail products to begin tracking stock."
              action={
                canWrite ? (
                  <ButtonLink href="/admin/inventory/products/new" size="sm">
                    Add a product
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>SKU</Th>
                    <Th>Category</Th>
                    <Th align="right">In stock</Th>
                    <Th align="right">Minimum</Th>
                    <Th align="right">Cost</Th>
                    <Th align="right">Price</Th>
                    <Th>Status</Th>
                    {canWrite && <Th align="right">Adjust</Th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const low = product.currentStock <= product.minimumStock;
                    const out = product.currentStock <= 0;
                    return (
                      <Tr key={product.id}>
                        <Td>
                          <Link
                            href={`/admin/inventory/products/${product.id}`}
                            className="font-medium hover:underline"
                          >
                            {product.name}
                          </Link>
                          {product.brand && (
                            <span className="block text-xs text-ink-subtle">{product.brand}</span>
                          )}
                        </Td>
                        <Td className="font-mono text-xs text-ink-subtle">{product.sku}</Td>
                        <Td className="text-ink-muted">{product.category}</Td>
                        <Td
                          align="right"
                          className={out ? "font-medium text-danger" : low ? "font-medium text-warning" : ""}
                        >
                          {product.currentStock} {product.unit}
                        </Td>
                        <Td align="right" className="text-ink-subtle">
                          {product.minimumStock}
                        </Td>
                        <Td align="right" className="text-ink-muted">
                          {formatCurrency(product.purchasePrice, settings.currencySymbol)}
                        </Td>
                        <Td align="right">
                          {formatCurrency(product.sellingPrice, settings.currencySymbol)}
                        </Td>
                        <Td>
                          {out ? (
                            <Badge tone="danger" dot>
                              Out of stock
                            </Badge>
                          ) : low ? (
                            <Badge tone="warning" dot>
                              Low
                            </Badge>
                          ) : (
                            <Badge tone="success" dot>
                              In stock
                            </Badge>
                          )}
                        </Td>
                        {canWrite && (
                          <Td align="right">
                            <StockAdjustButton
                              productId={product.id}
                              productName={product.name}
                              unit={product.unit}
                              currentStock={product.currentStock}
                            />
                          </Td>
                        )}
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </AdminSection>
      </div>
    </>
  );
}
