import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection, InvoiceStatusBadge } from "@/components/admin/admin-ui";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getInvoice, getPaymentsForInvoice } from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  return { title: invoice?.invoiceNumber ?? "Invoice" };
}

/**
 * Invoice detail.
 *
 * The document itself is styled to print cleanly — the `no-print` class removes
 * the admin chrome, so the browser print dialog produces a usable receipt or a
 * PDF without a separate rendering pipeline.
 */
export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "invoices.read")) notFound();

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const [payments, settings] = await Promise.all([getPaymentsForInvoice(id), getSettings()]);

  return (
    <>
      <div className="no-print">
        <AdminPageHeader
          domain="clinic"
          title={invoice.invoiceNumber}
          description={`${invoice.patientName} · ${formatDate(invoice.date)}`}
          breadcrumb={[
            { label: "Clinic", href: "/admin" },
            { label: "Invoices", href: "/admin/clinic/invoices" },
            { label: invoice.invoiceNumber },
          ]}
          actions={
            <InvoiceActions
              invoice={invoice}
              canRecordPayment={hasPermission(ctx, "payments.write")}
              canVoid={hasPermission(ctx, "invoices.void")}
              currencySymbol={settings.currencySymbol}
            />
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Printable document */}
        <div className="lg:col-span-2">
          <article className="rounded-md border border-line-subtle bg-canvas-raised p-6 sm:p-10">
            <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line-subtle pb-8">
              <div>
                <p className="font-display text-xl text-ink">{settings.clinicName}</p>
                <p className="mt-1 text-[0.5625rem] uppercase tracking-[0.28em] text-ink-subtle">
                  {settings.tagline}
                </p>
                <address className="mt-4 text-xs not-italic leading-relaxed text-ink-muted">
                  {settings.addressLine}
                  <br />
                  {settings.city}, {settings.country}
                  <br />
                  {settings.phone}
                </address>
              </div>

              <div className="text-right">
                <p className="text-[0.625rem] uppercase tracking-[0.18em] text-ink-subtle">
                  Invoice
                </p>
                <p className="mt-1 font-mono text-lg text-ink">{invoice.invoiceNumber}</p>
                <p className="mt-2 text-xs text-ink-muted">{formatDate(invoice.date)}</p>
                <div className="mt-3 flex justify-end">
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
              </div>
            </header>

            <div className="grid gap-6 border-b border-line-subtle py-6 sm:grid-cols-2">
              <div>
                <p className="text-[0.625rem] uppercase tracking-[0.18em] text-ink-subtle">
                  Billed to
                </p>
                <p className="mt-2 text-sm font-medium text-ink">{invoice.patientName}</p>
                {invoice.patientPhone && (
                  <p className="mt-0.5 text-xs text-ink-muted">{invoice.patientPhone}</p>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-[0.625rem] uppercase tracking-[0.18em] text-ink-subtle">
                  Served by
                </p>
                <p className="mt-2 text-sm text-ink">{invoice.cashierName}</p>
              </div>
            </div>

            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="pb-2 text-left text-[0.625rem] uppercase tracking-[0.14em] text-ink-subtle">
                    Item
                  </th>
                  <th scope="col" className="pb-2 text-right text-[0.625rem] uppercase tracking-[0.14em] text-ink-subtle">
                    Qty
                  </th>
                  <th scope="col" className="pb-2 text-right text-[0.625rem] uppercase tracking-[0.14em] text-ink-subtle">
                    Price
                  </th>
                  <th scope="col" className="pb-2 text-right text-[0.625rem] uppercase tracking-[0.14em] text-ink-subtle">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, i) => (
                  <tr key={`${line.refId}-${i}`} className="border-b border-line-subtle">
                    <td className="py-3">
                      <span className="text-ink">{line.name}</span>
                      <span className="mt-0.5 block text-[0.6875rem] capitalize text-ink-subtle">
                        {line.kind}
                        {line.discount > 0 &&
                          ` · ${formatCurrency(line.discount, settings.currencySymbol)} discount`}
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-ink-muted">{line.quantity}</td>
                    <td className="py-3 text-right tabular-nums text-ink-muted">
                      {formatCurrency(line.unitPrice, settings.currencySymbol)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-ink">
                      {formatCurrency(line.total, settings.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="ml-auto mt-6 max-w-xs space-y-2 text-sm">
              <Row label="Subtotal" value={formatCurrency(invoice.subtotal, settings.currencySymbol)} />
              {invoice.discountTotal > 0 && (
                <Row
                  label="Discount"
                  value={`− ${formatCurrency(invoice.discountTotal, settings.currencySymbol)}`}
                />
              )}
              {invoice.taxTotal > 0 && (
                <Row
                  label={settings.taxLabel}
                  value={formatCurrency(invoice.taxTotal, settings.currencySymbol)}
                />
              )}
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">
                  {formatCurrency(invoice.total, settings.currencySymbol)}
                </dd>
              </div>
              <Row
                label="Paid"
                value={formatCurrency(invoice.amountPaid, settings.currencySymbol)}
              />
              {invoice.balance > 0 && (
                <div className="flex justify-between font-medium text-danger">
                  <dt>Balance due</dt>
                  <dd className="tabular-nums">
                    {formatCurrency(invoice.balance, settings.currencySymbol)}
                  </dd>
                </div>
              )}
            </dl>

            {invoice.notes && (
              <p className="mt-8 border-t border-line-subtle pt-5 text-xs leading-relaxed text-ink-muted">
                {invoice.notes}
              </p>
            )}

            {invoice.status === "Void" && (
              <p className="mt-6 rounded-sm border border-danger/25 bg-danger-bg px-4 py-3 text-xs text-danger">
                This invoice was voided. Reason: {invoice.voidedReason ?? "not recorded"}.
              </p>
            )}

            <footer className="mt-10 border-t border-line-subtle pt-5 text-[0.6875rem] leading-relaxed text-ink-subtle">
              Thank you for choosing {settings.clinicName}. Treatment outcomes vary from person to
              person. Please contact us on {settings.phone} with any questions about this invoice.
            </footer>
          </article>

          <p className="no-print mt-3 flex items-center gap-2 text-xs text-ink-subtle">
            <Printer className="size-3.5" aria-hidden="true" />
            Use your browser print dialog to print this invoice or save it as a PDF.
          </p>
        </div>

        {/* Payment history */}
        <div className="no-print space-y-6">
          <AdminSection title="Payments" description={`${payments.length} recorded`}>
            {payments.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-subtle">
                No payments recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {payments.map((payment) => (
                  <li key={payment.id} className="px-5 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          payment.isRefund ? "text-danger" : "text-success"
                        }`}
                      >
                        {payment.isRefund ? "−" : "+"}
                        {formatCurrency(payment.amount, settings.currencySymbol)}
                      </span>
                      <Badge tone="neutral">{payment.method}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-subtle">
                      {formatDateTime(payment.date)} · {payment.receivedByName}
                    </p>
                    {payment.reference && (
                      <p className="mt-0.5 font-mono text-xs text-ink-subtle">
                        {payment.reference}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </AdminSection>

          <AdminSection title="Linked records">
            <ul className="divide-y divide-line-subtle text-sm">
              <li className="px-5 py-3">
                <Link
                  href={`/admin/clinic/patients/${invoice.patientId}`}
                  className="text-ink hover:underline"
                >
                  Patient record →
                </Link>
              </li>
              {invoice.appointmentId && (
                <li className="px-5 py-3">
                  <Link
                    href="/admin/clinic/appointments"
                    className="text-ink hover:underline"
                  >
                    Linked appointment →
                  </Link>
                </li>
              )}
            </ul>
          </AdminSection>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}
