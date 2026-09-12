"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Input, Select, Textarea } from "@/components/ui/form";
import { createExpense } from "@/server/actions/finance";
import { dateKey } from "@/lib/utils/format";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/types";
import { DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";
import type { ActionResult } from "@/lib/action-result";

export function ExpenseDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createExpense, null);

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      <Button icon={<Plus />} onClick={() => setOpen(true)}>
        Record expense
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record an expense"
        description="Recorded against your account and included in the net revenue figure."
        size="md"
      >
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="branchId" value={DEFAULT_BRANCH_ID} />

          {state?.message && !state.ok && (
            <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-xs text-danger">
              {state.message}
            </p>
          )}

          <Input
            name="title"
            label="What was it for?"
            required
            autoFocus
            placeholder="Monthly clinic rent"
            error={state?.errors?.title}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="category"
              label="Category"
              required
              defaultValue="Miscellaneous"
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              error={state?.errors?.category}
            />
            <Input
              name="amount"
              label="Amount"
              type="number"
              min={0}
              step="0.01"
              required
              error={state?.errors?.amount}
            />
            <Input
              name="date"
              label="Date"
              type="date"
              required
              defaultValue={dateKey()}
              max={dateKey()}
              error={state?.errors?.date}
            />
            <Select
              name="method"
              label="Paid by"
              required
              defaultValue="Bank Transfer"
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            />
          </div>

          <Input name="vendor" label="Vendor" placeholder="Who was paid" />
          <Textarea name="notes" label="Notes" rows={2} />

          <div className="flex justify-end gap-3 border-t border-line-subtle pt-4">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </div>
        </form>
      </Modal>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Saving…" : "Record expense"}
    </Button>
  );
}
