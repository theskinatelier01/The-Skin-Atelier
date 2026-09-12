"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Printer, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Input, Select, Textarea } from "@/components/ui/form";
import { recordPayment, voidInvoice } from "@/server/actions/finance";
import { formatCurrency } from "@/lib/utils/format";
import { PAYMENT_METHODS, type Invoice } from "@/types";

export function InvoiceActions({
  invoice,
  canRecordPayment,
  canVoid,
  currencySymbol,
}: {
  invoice: Invoice;
  canRecordPayment: boolean;
  canVoid: boolean;
  currencySymbol: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [payOpen, setPayOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState(String(invoice.balance || ""));
  const [method, setMethod] = useState<string>("Cash");
  const [reference, setReference] = useState("");
  const [voidReason, setVoidReason] = useState("");

  const settled = invoice.status === "Paid" || invoice.status === "Void";

  function submitPayment() {
    setError(null);
    startTransition(async () => {
      const result = await recordPayment({
        invoiceId: invoice.id,
        amount: Number(amount),
        method,
        reference: reference || undefined,
      });
      if (result.ok) {
        setPayOpen(false);
        router.refresh();
      } else {
        setError(result.message ?? "The payment could not be recorded.");
      }
    });
  }

  function submitVoid() {
    setError(null);
    startTransition(async () => {
      const result = await voidInvoice(invoice.id, voidReason);
      if (result.ok) {
        setVoidOpen(false);
        router.refresh();
      } else {
        setError(result.message ?? "The invoice could not be voided.");
      }
    });
  }

  return (
    <>
      <Button variant="outline" icon={<Printer />} onClick={() => window.print()}>
        Print
      </Button>

      {canRecordPayment && !settled && (
        <Button icon={<Wallet />} onClick={() => setPayOpen(true)}>
          Record payment
        </Button>
      )}

      {canVoid && invoice.status !== "Void" && (
        <Button variant="ghost" icon={<Ban />} onClick={() => setVoidOpen(true)}>
          Void
        </Button>
      )}

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Record a payment"
        description={`${formatCurrency(invoice.balance, currencySymbol)} outstanding on ${invoice.invoiceNumber}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submitPayment} loading={pending}>
              Record payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          <Input
            label="Amount"
            type="number"
            min={0}
            max={invoice.balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={`Maximum ${formatCurrency(invoice.balance, currencySymbol)}`}
            required
          />
          <Select
            label="Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
          />
          <Input
            label="Reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            hint="Transaction id for card, transfer, Easypaisa or JazzCash"
          />
        </div>
      </Modal>

      <Modal
        open={voidOpen}
        onClose={() => setVoidOpen(false)}
        title="Void this invoice?"
        description="The invoice stays on record, marked as void. This cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setVoidOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submitVoid} loading={pending} disabled={!voidReason.trim()}>
              Void invoice
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          <Textarea
            label="Reason"
            required
            rows={3}
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            hint="Recorded in the audit log against your account"
          />
          <p className="text-xs text-ink-subtle">
            Voiding does not return sold stock to inventory. Record a separate stock movement if
            goods were returned.
          </p>
        </div>
      </Modal>
    </>
  );
}
