"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlay";
import { writeOffExpiredBatches } from "@/server/actions/inventory";

/**
 * Writes off every batch past its expiry date.
 *
 * Confirmed rather than immediate, because it moves stock value off the books
 * and each write-off becomes a permanent ledger entry.
 */
export function WriteOffExpiredButton({ count }: { count: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <>
      <Button variant="danger" icon={<Trash2 />} onClick={() => setOpen(true)}>
        Write off {count} expired
      </Button>

      {message && (
        <p role="status" className="text-xs text-ink-muted">
          {message}
        </p>
      )}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        loading={pending}
        destructive
        confirmLabel="Write off expired stock"
        title="Write off expired stock?"
        message={`${count} batches are past their expiry date. Their remaining quantity will be removed from stock and recorded as an EXPIRED movement against your account. This cannot be undone.`}
        onConfirm={() =>
          startTransition(async () => {
            const result = await writeOffExpiredBatches();
            setMessage(result.message ?? null);
            setOpen(false);
            router.refresh();
          })
        }
      />
    </>
  );
}
