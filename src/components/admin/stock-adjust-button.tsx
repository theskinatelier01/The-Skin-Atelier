"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Input, Select, Textarea } from "@/components/ui/form";
import { recordStockMovement } from "@/server/actions/inventory";
import { STOCK_MOVEMENT_TYPES } from "@/types";

/**
 * Records a stock movement against a product.
 *
 * The sign of the quantity is derived from the movement type rather than typed
 * by the user, which removes the most common data-entry error in stock control
 * — entering a write-off as a positive number.
 */
const OUTBOUND = new Set(["STOCK_OUT", "EXPIRED", "DAMAGED", "WASTAGE", "SALE", "TREATMENT_USE"]);

export function StockAdjustButton({
  productId,
  productName,
  unit,
  currentStock,
}: {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<string>("STOCK_IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const outbound = OUTBOUND.has(type);
  const magnitude = Math.abs(Number(quantity) || 0);
  const projected = currentStock + (outbound ? -magnitude : magnitude);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await recordStockMovement({
        productId,
        type,
        quantity: outbound ? -magnitude : magnitude,
        reason: reason || undefined,
      });

      if (result.ok) {
        setOpen(false);
        setQuantity("");
        setReason("");
        router.refresh();
      } else {
        setError(result.message ?? result.errors?.quantity ?? "The movement could not be recorded.");
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label={`Adjust stock for ${productName}`}
        className="px-2"
      >
        <ArrowUpDown className="size-4" aria-hidden="true" />
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record a stock movement"
        description={`${productName} — currently ${currentStock} ${unit}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} loading={pending} disabled={magnitude <= 0}>
              Record movement
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

          <Select
            label="Movement type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={STOCK_MOVEMENT_TYPES.filter((t) => t !== "SALE").map((t) => ({
              value: t,
              label: t.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()),
            }))}
            hint={outbound ? "Stock will be reduced" : "Stock will be increased"}
          />

          <Input
            label={`Quantity (${unit})`}
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            hint={
              magnitude > 0
                ? `New level will be ${projected} ${unit}${projected < 0 ? " — not permitted" : ""}`
                : undefined
            }
            error={projected < 0 ? "This would take stock negative." : undefined}
            required
          />

          <Textarea
            label="Reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            hint="Recorded in the ledger and the audit log"
          />

          {outbound && (
            <p className="text-xs text-ink-subtle">
              Outbound movements consume the batch closest to expiry first (FEFO).
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
