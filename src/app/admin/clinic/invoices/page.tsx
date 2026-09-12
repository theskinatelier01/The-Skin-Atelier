import Link from "next/link";
import { Receipt } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, InvoiceStatusBadge, StatCard } from "@/components/admin/admin-ui";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { requirePermission } from "@/lib/auth/session";
import { getInvoices } from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("invoices.read");

  const { status } = await searchParams;
  const [invoices, settings] = await Promise.all([getInvoices(200, status), getSettings()]);

  const totals = invoices.reduce(
    (acc, i) => {
      if (i.status === "Void") return acc;
      acc.invoiced += i.total;
      acc.collected += i.amountPaid;
      acc.outstanding += i.balance;
      return acc;
    },
    { invoiced: 0, collected: 0, outstanding: 0 },
  );

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Invoices"
        description="Invoices are voided rather than deleted, so the billing record is always complete."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Invoices" }]}
        actions={
          <ButtonLink href="/admin/clinic/pos" icon={<Receipt />}>
            New sale
          </ButtonLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Invoiced"
          value={formatCurrency(totals.invoiced, settings.currencySymbol, { compact: true })}
          hint={`${invoices.length} invoices`}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(totals.collected, settings.currencySymbol, { compact: true })}
          tone="positive"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(totals.outstanding, settings.currencySymbol, { compact: true })}
          tone={totals.outstanding > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="mt-5">
        <FilterTabs
          basePath="/admin/clinic/invoices"
          param="status"
          current={status}
          options={["Unpaid", "Partially Paid", "Paid", "Refunded", "Void"]}
        />
      </div>

      <div className="mt-5">
        <AdminSection title="All invoices" description={`${invoices.length} shown`}>
          {invoices.length === 0 ? (
            <EmptyState
              icon={<Receipt />}
              title="No invoices"
              description="Invoices appear here once a sale is completed at the point of sale."
              action={
                <ButtonLink href="/admin/clinic/pos" size="sm">
                  Open the till
                </ButtonLink>
              }
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Date</Th>
                    <Th>Patient</Th>
                    <Th>Cashier</Th>
                    <Th align="right">Total</Th>
                    <Th align="right">Paid</Th>
                    <Th align="right">Balance</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <Tr key={invoice.id}>
                      <Td>
                        <Link
                          href={`/admin/clinic/invoices/${invoice.id}`}
                          className="font-mono text-xs font-medium hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(invoice.date)}
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/clinic/patients/${invoice.patientId}`}
                          className="hover:underline"
                        >
                          {invoice.patientName}
                        </Link>
                      </Td>
                      <Td className="truncate text-xs text-ink-subtle">{invoice.cashierName}</Td>
                      <Td align="right">
                        {formatCurrency(invoice.total, settings.currencySymbol)}
                      </Td>
                      <Td align="right" className="text-success">
                        {formatCurrency(invoice.amountPaid, settings.currencySymbol)}
                      </Td>
                      <Td align="right" className={invoice.balance > 0 ? "text-danger" : ""}>
                        {invoice.balance > 0
                          ? formatCurrency(invoice.balance, settings.currencySymbol)
                          : "—"}
                      </Td>
                      <Td>
                        <InvoiceStatusBadge status={invoice.status} />
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
