import { BarChart3, Download } from "lucide-react";

import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { ExportButton } from "@/components/admin/export-button";
import { requirePermission } from "@/lib/auth/session";
import {
  getAppointmentsInRange,
  getExpensesBetween,
  getInvoicesBetween,
  getLeads,
  getPatients,
  getProducts,
} from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { dateKey, formatCurrency } from "@/lib/utils/format";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

/**
 * Reporting.
 *
 * Each report is generated from live data and exported as CSV on demand, so
 * there is no nightly job to fall behind and no stale snapshot to explain.
 */
export default async function ReportsPage() {
  await requirePermission("finance.reports");

  const now = Date.now();
  const day = 86_400_000;
  const from = new Date(now - 30 * day).toISOString();

  const [invoices, expenses, appointments, patients, products, leads, settings] = await Promise.all([
    getInvoicesBetween(from, new Date(now).toISOString()),
    getExpensesBetween(from, new Date(now).toISOString()),
    getAppointmentsInRange(dateKey(new Date(now - 30 * day)), dateKey()),
    getPatients(500),
    getProducts(),
    getLeads(),
    getSettings(),
  ]);

  const live = invoices.filter((i) => i.status !== "Void");
  const collected = live.reduce((sum, i) => sum + i.amountPaid, 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const completed = appointments.filter((a) => a.status === "Completed").length;
  const noShows = appointments.filter((a) => a.status === "No Show").length;
  const convertedLeads = leads.filter((l) => l.stage === "CONVERTED").length;

  // Typed explicitly so TypeScript keeps the heterogeneous row shapes rather
  // than narrowing the whole array to the first report.
  const reports: { name: string; description: string; rows: number; data: Record<string, unknown>[] }[] = [
    {
      name: "Daily sales",
      description: "Every invoice in the period with totals, payment status and cashier.",
      rows: live.length,
      data: live.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        date: String(i.date).slice(0, 10),
        patient: i.patientName,
        subtotal: i.subtotal,
        discount: i.discountTotal,
        tax: i.taxTotal,
        total: i.total,
        paid: i.amountPaid,
        balance: i.balance,
        status: i.status,
        cashier: i.cashierName,
      })),
    },
    {
      name: "Appointments",
      description: "Bookings with clinician, treatment, status and source.",
      rows: appointments.length,
      data: appointments.map((a) => ({
        date: a.date,
        time: a.startTime,
        patient: a.patientName,
        phone: a.patientPhone,
        treatment: a.serviceName,
        clinician: a.doctorName,
        status: a.status,
        payment: a.paymentStatus,
        source: a.source,
      })),
    },
    {
      name: "Patients",
      description: "The full directory with visit counts and lifetime value.",
      rows: patients.length,
      data: patients.map((p) => ({
        code: p.patientCode,
        name: p.fullName,
        phone: p.phone,
        gender: p.gender,
        source: p.source,
        registered: String(p.registrationDate).slice(0, 10),
        visits: p.stats?.totalVisits ?? 0,
        lifetimeValue: p.stats?.totalSpend ?? 0,
        outstanding: p.stats?.outstandingBalance ?? 0,
      })),
    },
    {
      name: "Inventory",
      description: "Stock levels, minimums and valuation at purchase price.",
      rows: products.length,
      data: products.map((p) => ({
        sku: p.sku,
        name: p.name,
        category: p.category,
        stock: p.currentStock,
        minimum: p.minimumStock,
        unit: p.unit,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        value: p.currentStock * p.purchasePrice,
        lowStock: p.currentStock <= p.minimumStock ? "yes" : "no",
      })),
    },
    {
      name: "Expenses",
      description: "All recorded spend, categorised.",
      rows: expenses.length,
      data: expenses.map((e) => ({
        date: String(e.date).slice(0, 10),
        title: e.title,
        category: e.category,
        vendor: e.vendor ?? "",
        method: e.method,
        amount: e.amount,
        recordedBy: e.recordedByName,
      })),
    },
    {
      name: "Lead conversion",
      description: "Pipeline with source, stage and assigned staff.",
      rows: leads.length,
      data: leads.map((l) => ({
        name: l.fullName,
        phone: l.phone,
        source: l.source,
        stage: l.stage,
        interestedIn: l.interestedServiceName ?? "",
        assignedTo: l.assignedToName ?? "",
        followUp: l.followUpDate ? String(l.followUpDate).slice(0, 10) : "",
      })),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Generated from live data over the last 30 days. Export any report as CSV for your accountant or for further analysis."
        breadcrumb={[{ label: "Finance", href: "/admin" }, { label: "Reports" }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Collected (30d)"
          value={formatCurrency(collected, settings.currencySymbol, { compact: true })}
          tone="positive"
          icon={<BarChart3 />}
        />
        <StatCard
          label="Net (30d)"
          value={formatCurrency(collected - expenseTotal, settings.currencySymbol, { compact: true })}
          tone={collected - expenseTotal >= 0 ? "positive" : "critical"}
        />
        <StatCard
          label="Appointments completed"
          value={completed}
          hint={`${noShows} no-shows`}
          tone={noShows > 0 ? "warning" : "positive"}
        />
        <StatCard
          label="Leads converted"
          value={convertedLeads}
          hint={`of ${leads.length} total`}
        />
      </div>

      <div className="mt-5">
        <AdminSection title="Available reports" description="Each exports as CSV">
          <ul className="divide-y divide-line-subtle">
            {reports.map((report) => (
              <li
                key={report.name}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{report.name}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{report.description}</p>
                  <p className="mt-1 text-xs text-ink-subtle">
                    {report.rows} {report.rows === 1 ? "row" : "rows"}
                  </p>
                </div>
                <ExportButton
                  filename={report.name.toLowerCase().replace(/\s+/g, "-")}
                  rows={report.data}
                  disabled={report.rows === 0}
                />
              </li>
            ))}
          </ul>
        </AdminSection>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-ink-subtle">
        <Download className="size-3.5" aria-hidden="true" />
        Exports contain patient names and contact details. Handle them as confidential and do not
        email them unencrypted.
      </p>
    </>
  );
}
