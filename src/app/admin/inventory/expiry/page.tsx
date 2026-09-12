import { notFound } from "next/navigation";
import { AlertTriangle, CalendarClock, PackageCheck } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { WriteOffExpiredButton } from "@/components/admin/write-off-expired-button";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getExpiringBatches } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Expiry" };

/**
 * Expiry control.
 *
 * Batches are listed strictly in expiry order, which is the order they must be
 * consumed in (FEFO). Anything already past its date is separated out, because
 * it is a write-off decision rather than a stock-rotation one.
 */
export default async function ExpiryPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "inventory.read")) notFound();

  const batches = await getExpiringBatches(180);
  const now = Date.now();
  const day = 86_400_000;

  const expired = batches.filter((b) => new Date(b.expiryDate).getTime() < now);
  const within30 = batches.filter((b) => {
    const t = new Date(b.expiryDate).getTime();
    return t >= now && t < now + 30 * day;
  });
  const within90 = batches.filter((b) => {
    const t = new Date(b.expiryDate).getTime();
    return t >= now + 30 * day && t < now + 90 * day;
  });
  const later = batches.filter((b) => new Date(b.expiryDate).getTime() >= now + 90 * day);

  return (
    <>
      <AdminPageHeader
        title="Expiry"
        description="First Expiry, First Out. Batches are consumed in this order automatically when stock is deducted."
        breadcrumb={[{ label: "Inventory", href: "/admin" }, { label: "Expiry" }]}
        actions={
          hasPermission(ctx, "inventory.batches.write") && expired.length > 0 ? (
            <WriteOffExpiredButton count={expired.length} />
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Expired"
          value={expired.length}
          tone={expired.length > 0 ? "critical" : "positive"}
          hint="Must be written off"
          icon={<AlertTriangle />}
        />
        <StatCard
          label="Within 30 days"
          value={within30.length}
          tone={within30.length > 0 ? "warning" : "neutral"}
          hint="Use these first"
          icon={<CalendarClock />}
        />
        <StatCard label="Within 90 days" value={within90.length} icon={<CalendarClock />} />
        <StatCard label="Later" value={later.length} icon={<PackageCheck />} />
      </div>

      <div className="mt-6 space-y-5">
        {expired.length > 0 && (
          <BatchTable
            title="Expired"
            description="This stock cannot be used. Write it off so the ledger reflects reality."
            batches={expired}
            tone="critical"
          />
        )}
        {within30.length > 0 && (
          <BatchTable
            title="Expiring within 30 days"
            description="Prioritise these in treatments and sales."
            batches={within30}
            tone="warning"
          />
        )}
        {within90.length > 0 && (
          <BatchTable title="Expiring within 90 days" batches={within90} />
        )}
        {later.length > 0 && <BatchTable title="Expiring later" batches={later} />}

        {batches.length === 0 && (
          <AdminSection title="Expiry">
            <EmptyState
              icon={<PackageCheck />}
              title="Nothing expiring"
              description="No batches are approaching their expiry date in the next six months."
            />
          </AdminSection>
        )}
      </div>
    </>
  );
}

function BatchTable({
  title,
  description,
  batches,
  tone,
}: {
  title: string;
  description?: string;
  batches: Awaited<ReturnType<typeof getExpiringBatches>>;
  tone?: "critical" | "warning";
}) {
  const now = Date.now();

  return (
    <AdminSection title={title} description={description}>
      <TableWrap className="rounded-none border-0">
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Batch</Th>
              <Th align="right">Remaining</Th>
              <Th>Expires</Th>
              <Th align="right">Days</Th>
              <Th>Supplier</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const days = Math.ceil((new Date(batch.expiryDate).getTime() - now) / 86_400_000);
              return (
                <Tr key={batch.id}>
                  <Td className="font-medium">{batch.productName}</Td>
                  <Td className="font-mono text-xs text-ink-subtle">{batch.batchNumber}</Td>
                  <Td align="right">{batch.quantityRemaining}</Td>
                  <Td className="whitespace-nowrap">{formatDate(batch.expiryDate)}</Td>
                  <Td
                    align="right"
                    className={
                      days < 0 ? "text-danger" : days < 30 ? "text-warning" : "text-ink-muted"
                    }
                  >
                    {days < 0 ? `${Math.abs(days)} ago` : days}
                  </Td>
                  <Td className="text-ink-muted">{batch.supplierName ?? "—"}</Td>
                  <Td>
                    <Badge tone={days < 0 ? "danger" : days < 30 ? "warning" : "neutral"} dot>
                      {days < 0 ? "Expired" : days < 30 ? "Use first" : "Active"}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>
    </AdminSection>
  );
}
