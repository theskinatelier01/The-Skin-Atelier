import { Receipt } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { ExpenseDialog } from "@/components/admin/expense-dialog";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getExpenses } from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { EXPENSE_CATEGORIES } from "@/types";
import { notFound } from "next/navigation";

export const metadata = { title: "Expenses" };
export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "expenses.read")) notFound();

  const [expenses, settings] = await Promise.all([getExpenses(200), getSettings()]);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = EXPENSE_CATEGORIES.map((category) => ({
    category,
    total: expenses.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0),
  }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <AdminPageHeader
        title="Expenses"
        description="Everything the clinic spends, categorised for the profit and loss view."
        breadcrumb={[{ label: "Finance", href: "/admin" }, { label: "Expenses" }]}
        actions={hasPermission(ctx, "expenses.write") ? <ExpenseDialog /> : undefined}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total recorded"
          value={formatCurrency(total, settings.currencySymbol, { compact: true })}
          icon={<Receipt />}
        />
        <StatCard label="Entries" value={expenses.length} />
        <StatCard label="Categories used" value={byCategory.length} />
      </div>

      {byCategory.length > 0 && (
        <div className="mt-5">
          <AdminSection title="By category">
            <ul className="divide-y divide-line-subtle">
              {byCategory.map((row) => (
                <li key={row.category} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-32 shrink-0 text-sm text-ink">{row.category}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-sunken">
                    <div
                      className="h-full rounded-full bg-champagne-400"
                      style={{ width: `${Math.round((row.total / total) * 100)}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="w-28 shrink-0 text-right text-sm tabular-nums text-ink">
                    {formatCurrency(row.total, settings.currencySymbol)}
                  </span>
                </li>
              ))}
            </ul>
          </AdminSection>
        </div>
      )}

      <div className="mt-5">
        <AdminSection title="All expenses" description={`${expenses.length} recorded`}>
          {expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt />}
              title="No expenses recorded"
              description="Record rent, salaries, stock purchases and marketing spend to see a true net position."
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Title</Th>
                    <Th>Category</Th>
                    <Th>Vendor</Th>
                    <Th>Method</Th>
                    <Th>Recorded by</Th>
                    <Th align="right">Amount</Th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <Tr key={expense.id}>
                      <Td className="whitespace-nowrap text-ink-muted">{formatDate(expense.date)}</Td>
                      <Td className="font-medium">{expense.title}</Td>
                      <Td>
                        <Badge tone="neutral">{expense.category}</Badge>
                      </Td>
                      <Td className="text-ink-muted">{expense.vendor ?? "—"}</Td>
                      <Td className="text-ink-muted">{expense.method}</Td>
                      <Td className="truncate text-xs text-ink-subtle">{expense.recordedByName}</Td>
                      <Td align="right">
                        {formatCurrency(expense.amount, settings.currencySymbol)}
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
