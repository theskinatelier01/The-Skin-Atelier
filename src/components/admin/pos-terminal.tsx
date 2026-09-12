"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { createInvoice } from "@/server/actions/finance";
import { formatCurrency } from "@/lib/utils/format";
import { PAYMENT_METHODS, type InvoiceLineKind } from "@/types";

interface CartLine {
  key: string;
  kind: InvoiceLineKind;
  refId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  /** Retail lines cannot exceed what is physically in stock. */
  maxQuantity?: number;
}

type Catalogue = {
  services: { id: string; name: string; price: number; category: string; onConsultation: boolean }[];
  packages: { id: string; name: string; price: number }[];
  products: { id: string; name: string; price: number; stock: number; unit: string }[];
};

/**
 * Counter terminal.
 *
 * Optimised for speed of entry: search filters all three catalogues at once,
 * one tap adds a line, and the totals recompute locally. The authoritative
 * maths is redone server-side when the sale is committed, so a tampered client
 * cannot change a price.
 */
export function PosTerminal({
  patients,
  services,
  packages,
  products,
  currencySymbol,
  taxPercent,
}: {
  patients: { id: string; name: string; phone: string; code: string }[];
  currencySymbol: string;
  taxPercent: number;
} & Catalogue) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [patientId, setPatientId] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"services" | "products" | "packages">("services");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const lower = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    const match = (name: string) => !lower || name.toLowerCase().includes(lower);
    return {
      services: services.filter((s) => match(s.name)),
      products: products.filter((p) => match(p.name)),
      packages: packages.filter((p) => match(p.name)),
    };
  }, [lower, services, products, packages]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    for (const line of cart) {
      const gross = line.quantity * line.unitPrice;
      const discount = Math.min(line.discount, gross);
      subtotal += gross;
      discountTotal += discount;
      taxTotal += (gross - discount) * (line.taxRate / 100);
    }
    return {
      subtotal,
      discountTotal,
      taxTotal,
      total: Math.round((subtotal - discountTotal + taxTotal) * 100) / 100,
    };
  }, [cart]);

  const tendered = Number(amountTendered) || 0;
  const change = tendered > totals.total ? tendered - totals.total : 0;
  const balance = Math.max(0, totals.total - tendered);

  function addLine(line: Omit<CartLine, "key" | "quantity" | "discount" | "taxRate">) {
    setCart((current) => {
      const key = `${line.kind}:${line.refId}`;
      const existing = current.find((l) => l.key === key);
      if (existing) {
        // Never let a retail line exceed available stock.
        const next = existing.quantity + 1;
        if (existing.maxQuantity && next > existing.maxQuantity) return current;
        return current.map((l) => (l.key === key ? { ...l, quantity: next } : l));
      }
      return [
        ...current,
        { ...line, key, quantity: 1, discount: 0, taxRate: line.kind === "product" ? taxPercent : 0 },
      ];
    });
  }

  function updateLine(key: string, patch: Partial<CartLine>) {
    setCart((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setCart((current) => current.filter((l) => l.key !== key));
  }

  function checkout() {
    setMessage(null);
    if (!patientId) {
      setMessage({ ok: false, text: "Select a patient before taking payment." });
      return;
    }
    if (cart.length === 0) {
      setMessage({ ok: false, text: "The cart is empty." });
      return;
    }

    startTransition(async () => {
      const result = await createInvoice({
        patientId,
        lines: cart.map((l) => ({
          kind: l.kind,
          refId: l.refId,
          name: l.name,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          taxRate: l.taxRate,
        })),
        payment: tendered > 0 ? { amount: Math.min(tendered, totals.total), method: paymentMethod } : undefined,
      });

      if (result.ok) {
        setCart([]);
        setAmountTendered("");
        setMessage({ ok: true, text: result.message ?? "Sale complete." });
        if (result.invoiceId) router.push(`/admin/clinic/invoices/${result.invoiceId}`);
      } else {
        setMessage({ ok: false, text: result.message ?? "The sale could not be completed." });
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Catalogue */}
      <div className="lg:col-span-3">
        <div className="rounded-md border border-line-subtle bg-canvas-raised">
          <div className="border-b border-line-subtle p-4">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search treatments, products and packages"
                aria-label="Search the catalogue"
                className="h-11 w-full rounded-sm border border-line bg-canvas pl-10 pr-3 text-sm outline-none focus:border-accent"
              />
            </div>

            <div role="tablist" aria-label="Catalogue" className="mt-3 flex gap-1">
              {(["services", "products", "packages"] as const).map((key) => (
                <button
                  key={key}
                  role="tab"
                  type="button"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "rounded-sm px-3 py-1.5 text-xs capitalize transition-colors",
                    tab === key
                      ? "bg-primary text-on-primary"
                      : "bg-canvas-sunken text-ink-muted hover:text-ink",
                  )}
                >
                  {key} ({filtered[key].length})
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[26rem] overflow-y-auto p-3">
            {filtered[tab].length === 0 ? (
              <EmptyState title="Nothing matches" description="Try a different search term." />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {tab === "services" &&
                  filtered.services.map((s) => (
                    <CatalogueItem
                      key={s.id}
                      title={s.name}
                      subtitle={s.category}
                      price={s.onConsultation ? null : s.price}
                      currencySymbol={currencySymbol}
                      // A consultation-priced treatment has no counter price to
                      // charge, so it must be quoted before it can be sold.
                      disabled={s.onConsultation}
                      disabledLabel="Quote at consultation"
                      onClick={() =>
                        addLine({ kind: "service", refId: s.id, name: s.name, unitPrice: s.price })
                      }
                    />
                  ))}

                {tab === "products" &&
                  filtered.products.map((p) => (
                    <CatalogueItem
                      key={p.id}
                      title={p.name}
                      subtitle={`${p.stock} ${p.unit} in stock`}
                      price={p.price}
                      currencySymbol={currencySymbol}
                      onClick={() =>
                        addLine({
                          kind: "product",
                          refId: p.id,
                          name: p.name,
                          unitPrice: p.price,
                          maxQuantity: p.stock,
                        })
                      }
                    />
                  ))}

                {tab === "packages" &&
                  filtered.packages.map((p) => (
                    <CatalogueItem
                      key={p.id}
                      title={p.name}
                      subtitle="Package"
                      price={p.price}
                      currencySymbol={currencySymbol}
                      onClick={() =>
                        addLine({ kind: "package", refId: p.id, name: p.name, unitPrice: p.price })
                      }
                    />
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-2">
        <div className="rounded-md border border-line-subtle bg-canvas-raised lg:sticky lg:top-24">
          <div className="border-b border-line-subtle p-4">
            <Select
              label="Patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Select a patient"
              options={patients.map((p) => ({
                value: p.id,
                label: `${p.name} · ${p.phone}`,
              }))}
              required
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {cart.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart />}
                title="Cart is empty"
                description="Tap an item to add it."
              />
            ) : (
              <ul className="divide-y divide-line-subtle">
                {cart.map((line) => (
                  <li key={line.key} className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{line.name}</p>
                        <p className="mt-0.5 text-xs text-ink-subtle">
                          {formatCurrency(line.unitPrice, currencySymbol)}
                          {line.taxRate > 0 && ` · ${line.taxRate}% tax`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        aria-label={`Remove ${line.name}`}
                        className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-subtle transition-colors hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex items-center rounded-sm border border-line">
                        <button
                          type="button"
                          onClick={() =>
                            updateLine(line.key, { quantity: Math.max(1, line.quantity - 1) })
                          }
                          aria-label={`Decrease quantity of ${line.name}`}
                          className="grid size-8 place-items-center text-ink-muted hover:text-ink"
                        >
                          <Minus className="size-3" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{line.quantity}</span>
                        <button
                          type="button"
                          disabled={Boolean(line.maxQuantity && line.quantity >= line.maxQuantity)}
                          onClick={() => updateLine(line.key, { quantity: line.quantity + 1 })}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="grid size-8 place-items-center text-ink-muted hover:text-ink disabled:opacity-40"
                        >
                          <Plus className="size-3" aria-hidden="true" />
                        </button>
                      </div>

                      <label className="sr-only" htmlFor={`discount-${line.key}`}>
                        Discount on {line.name}
                      </label>
                      <input
                        id={`discount-${line.key}`}
                        type="number"
                        min={0}
                        value={line.discount || ""}
                        placeholder="Discount"
                        onChange={(e) =>
                          updateLine(line.key, { discount: Number(e.target.value) || 0 })
                        }
                        className="h-8 w-24 rounded-sm border border-line bg-canvas px-2 text-xs outline-none focus:border-accent"
                      />

                      <span className="ml-auto text-sm font-medium tabular-nums text-ink">
                        {formatCurrency(
                          line.quantity * line.unitPrice - line.discount,
                          currencySymbol,
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Totals and payment */}
          <div className="border-t border-line-subtle p-4">
            <dl className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(totals.subtotal, currencySymbol)} />
              {totals.discountTotal > 0 && (
                <Row
                  label="Discount"
                  value={`− ${formatCurrency(totals.discountTotal, currencySymbol)}`}
                />
              )}
              {totals.taxTotal > 0 && (
                <Row label="Tax" value={formatCurrency(totals.taxTotal, currencySymbol)} />
              )}
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(totals.total, currencySymbol)}</dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Select
                label="Payment method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
              />
              <Input
                label="Amount received"
                type="number"
                min={0}
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder="0"
              />
            </div>

            {tendered > 0 && (
              <dl className="mt-3 space-y-1 text-xs">
                {change > 0 && (
                  <Row label="Change due" value={formatCurrency(change, currencySymbol)} />
                )}
                {balance > 0 && (
                  <Row
                    label="Remaining balance"
                    value={formatCurrency(balance, currencySymbol)}
                    tone="warning"
                  />
                )}
              </dl>
            )}

            {message && (
              <p
                role="status"
                className={cn(
                  "mt-3 rounded-sm px-3 py-2 text-xs",
                  message.ok ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
                )}
              >
                {message.text}
              </p>
            )}

            <Button
              fullWidth
              size="lg"
              className="mt-4"
              loading={pending}
              disabled={cart.length === 0 || !patientId}
              onClick={checkout}
            >
              {pending
                ? "Processing…"
                : `Complete sale · ${formatCurrency(totals.total, currencySymbol)}`}
            </Button>

            {balance > 0 && cart.length > 0 && (
              <p className="mt-2 text-center text-xs text-ink-subtle">
                This will be recorded as partially paid.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogueItem({
  title,
  subtitle,
  price,
  currencySymbol,
  onClick,
  disabled,
  disabledLabel,
}: {
  title: string;
  subtitle: string;
  price: number | null;
  currencySymbol: string;
  onClick: () => void;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex w-full min-h-[4.5rem] flex-col justify-between rounded-sm border border-line-subtle p-3 text-left transition-colors",
          disabled
            ? "cursor-not-allowed bg-canvas-sunken opacity-60"
            : "bg-canvas hover:border-line-strong hover:bg-canvas-sunken",
        )}
      >
        <span className="line-clamp-2 text-sm font-medium text-ink">{title}</span>
        <span className="mt-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-ink-subtle">{subtitle}</span>
          {disabled ? (
            <Badge tone="neutral">{disabledLabel}</Badge>
          ) : (
            <span className="shrink-0 text-sm tabular-nums text-ink">
              {formatCurrency(price, currencySymbol)}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning";
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={cn("tabular-nums", tone === "warning" ? "text-warning" : "text-ink")}>
        {value}
      </dd>
    </div>
  );
}
