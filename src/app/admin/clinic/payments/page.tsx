import Link from "next/link";
import { Wallet } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { requirePermission } from "@/lib/auth/session";
import { getPayments } from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { PAYMENT_METHODS } from "@/types";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  await requirePermission("payments.read");

  const [payments, settings] = await Promise.all([getPayments(200), getSettings()]);

  const received = payments.filter((p) => !p.isRefund).reduce((s, p) => s + p.amount, 0);
  const refunded = payments.filter((p) => p.isRefund).reduce((s, p) => s + p.amount, 0);

  const byMethod = PAYMENT_METHODS.map((method) => ({
    method,
    total: payments
      .filter((p) => p.method === method && !p.isRefund)
      .reduce((s, p) => s + p.amount, 0),
  }))
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Payments"
        description="Every payment and refund recorded against an invoice."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Payments" }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Received"
          value={formatCurrency(received, settings.currencySymbol, { compact: true })}
          tone="positive"
          icon={<Wallet />}
        />
        <StatCard
          label="Refunded"
          value={formatCurrency(refunded, settings.currencySymbol, { compact: true })}
          tone={refunded > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Net"
          value={formatCurrency(received - refunded, settings.currencySymbol, { compact: true })}
        />
      </div>

      {byMethod.length > 0 && (
        <div className="mt-5">
          <AdminSection title="By payment method" description="Share of everything received">
            <ul className="divide-y divide-line-subtle">
              {byMethod.map((m) => (
                <li key={m.method} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-32 shrink-0 text-sm text-ink">{m.method}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-sunken">
                    <div
                      className="h-full rounded-full bg-champagne-400"
                      style={{ width: `${Math.round((m.total / received) * 100)}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="w-28 shrink-0 text-right text-sm tabular-nums text-ink">
                    {formatCurrency(m.total, settings.currencySymbol)}
                  </span>
                </li>
              ))}
            </ul>
          </AdminSection>
        </div>
      )}

      <div className="mt-5">
        <AdminSection title="All payments" description={`${payments.length} recorded`}>
          {payments.length === 0 ? (
            <EmptyState
              icon={<Wallet />}
              title="No payments recorded"
              description="Payments appear here as soon as a sale is completed or a balance is settled."
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Invoice</Th>
                    <Th>Patient</Th>
                    <Th>Method</Th>
                    <Th>Reference</Th>
                    <Th>Received by</Th>
                    <Th align="right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <Tr key={payment.id}>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDateTime(payment.date)}
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/clinic/invoices/${payment.invoiceId}`}
                          className="font-mono text-xs hover:underline"
                        >
                          {payment.invoiceNumber}
                        </Link>
                      </Td>
                      <Td>{payment.patientName}</Td>
                      <Td>
                        <Badge tone="neutral">{payment.method}</Badge>
                      </Td>
                      <Td className="font-mono text-xs text-ink-subtle">
                        {payment.reference ?? "—"}
                      </Td>
                      <Td className="truncate text-xs text-ink-subtle">{payment.receivedByName}</Td>
                      <Td align="right" className={payment.isRefund ? "text-danger" : "text-success"}>
                        {payment.isRefund ? "−" : "+"}
                        {formatCurrency(payment.amount, settings.currencySymbol)}
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
