import { TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { requirePermission } from "@/lib/auth/session";
import { getExpensesBetween, getInvoicesBetween } from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { formatCurrency } from "@/lib/utils/format";

export const metadata = { title: "Revenue" };
export const dynamic = "force-dynamic";

/**
 * Revenue dashboard.
 *
 * Compares the selected window against the immediately preceding window of the
 * same length, which is the only comparison that is meaningful without a full
 * year of history.
 */
export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requirePermission("finance.reports");

  const { days } = await searchParams;
  const windowDays = Number(days) || 30;
  const now = Date.now();
  const day = 86_400_000;

  const from = new Date(now - windowDays * day).toISOString();
  const previousFrom = new Date(now - windowDays * 2 * day).toISOString();

  const [invoices, previousInvoices, expenses, settings] = await Promise.all([
    getInvoicesBetween(from, new Date(now).toISOString()),
    getInvoicesBetween(previousFrom, from),
    getExpensesBetween(from, new Date(now).toISOString()),
    getSettings(),
  ]);

  const live = invoices.filter((i) => i.status !== "Void");
  const previousLive = previousInvoices.filter((i) => i.status !== "Void");

  const collected = live.reduce((sum, i) => sum + i.amountPaid, 0);
  const previousCollected = previousLive.reduce((sum, i) => sum + i.amountPaid, 0);
  const outstanding = live.reduce((sum, i) => sum + i.balance, 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const trend = previousCollected > 0
    ? ((collected - previousCollected) / previousCollected) * 100
    : undefined;

  // Revenue by line kind, which is what tells the clinic where money comes from.
  const byKind = live.reduce<Record<string, number>>((acc, invoice) => {
    for (const line of invoice.lines) {
      acc[line.kind] = (acc[line.kind] ?? 0) + line.total;
    }
    return acc;
  }, {});

  const byService = live.reduce<Record<string, number>>((acc, invoice) => {
    for (const line of invoice.lines) {
      if (line.kind !== "service") continue;
      acc[line.name] = (acc[line.name] ?? 0) + line.total;
    }
    return acc;
  }, {});

  const topServices = Object.entries(byService)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Daily series for the chart.
  const series = Array.from({ length: Math.min(windowDays, 90) }, (_, i) => {
    const date = new Date(now - (Math.min(windowDays, 90) - 1 - i) * day);
    const key = date.toISOString().slice(0, 10);
    const total = live
      .filter((inv) => String(inv.date).slice(0, 10) === key)
      .reduce((sum, inv) => sum + inv.amountPaid, 0);
    return { date: key, label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), total };
  });

  return (
    <>
      <AdminPageHeader
        title="Revenue"
        description={`Last ${windowDays} days, compared with the ${windowDays} days before that.`}
        breadcrumb={[{ label: "Finance", href: "/admin" }, { label: "Revenue" }]}
      />

      <nav aria-label="Period" className="mb-5 flex gap-1">
        {[7, 30, 90, 365].map((option) => (
          <a
            key={option}
            href={`/admin/finance/revenue?days=${option}`}
            aria-current={windowDays === option ? "true" : undefined}
            className={
              windowDays === option
                ? "rounded-sm border border-ink bg-primary px-3 py-1.5 text-xs text-on-primary"
                : "rounded-sm border border-line bg-canvas-raised px-3 py-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
            }
          >
            {option === 365 ? "12 months" : `${option} days`}
          </a>
        ))}
      </nav>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Collected"
          value={formatCurrency(collected, settings.currencySymbol, { compact: true })}
          trend={trend}
          tone="positive"
          icon={<TrendingUp />}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding, settings.currencySymbol, { compact: true })}
          tone={outstanding > 0 ? "warning" : "neutral"}
          href="/admin/clinic/invoices?status=Unpaid"
        />
        <StatCard
          label="Expenses"
          value={formatCurrency(expenseTotal, settings.currencySymbol, { compact: true })}
          href="/admin/finance/expenses"
        />
        <StatCard
          label="Net"
          value={formatCurrency(collected - expenseTotal, settings.currencySymbol, { compact: true })}
          tone={collected - expenseTotal >= 0 ? "positive" : "critical"}
          hint="Collected less expenses"
        />
      </div>

      <div className="mt-5">
        <AdminSection title="Revenue over time" description="Amount collected per day">
          {series.every((point) => point.total === 0) ? (
            <EmptyState
              icon={<TrendingUp />}
              title="No revenue in this period"
              description="Completed sales appear here as soon as payment is recorded."
            />
          ) : (
            <div className="p-5">
              <RevenueChart data={series} currencySymbol={settings.currencySymbol} />
            </div>
          )}
        </AdminSection>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <AdminSection title="Revenue by type" description="Where the money came from">
          {Object.keys(byKind).length === 0 ? (
            <EmptyState title="Nothing invoiced yet" />
          ) : (
            <ul className="divide-y divide-line-subtle">
              {Object.entries(byKind)
                .sort(([, a], [, b]) => b - a)
                .map(([kind, total]) => {
                  const share = Math.round((total / Object.values(byKind).reduce((a, b) => a + b, 0)) * 100);
                  return (
                    <li key={kind} className="flex items-center gap-4 px-5 py-3">
                      <span className="w-24 shrink-0 text-sm capitalize text-ink">{kind}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-sunken">
                        <div
                          className="h-full rounded-full bg-champagne-400"
                          style={{ width: `${share}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-subtle">
                        {share}%
                      </span>
                      <span className="w-28 shrink-0 text-right text-sm tabular-nums text-ink">
                        {formatCurrency(total, settings.currencySymbol, { compact: true })}
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </AdminSection>

        <AdminSection title="Top treatments" description="By revenue in this period">
          {topServices.length === 0 ? (
            <EmptyState title="No treatments sold yet" />
          ) : (
            <ol className="divide-y divide-line-subtle">
              {topServices.map(([name, total], i) => (
                <li key={name} className="flex items-center gap-4 px-5 py-3">
                  <span aria-hidden="true" className="w-5 shrink-0 text-xs tabular-nums text-ink-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-ink">
                    {formatCurrency(total, settings.currencySymbol, { compact: true })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </AdminSection>
      </div>
    </>
  );
}
