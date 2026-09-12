"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { saveProduct } from "@/server/actions/inventory";
import { INVENTORY_CATEGORIES, type Product, type Supplier } from "@/types";
import type { ActionResult } from "@/lib/action-result";

type Result = ActionResult & { productId?: string };

export function ProductForm({
  product,
  suppliers,
  branchId,
}: {
  product?: Product;
  suppliers: Supplier[];
  branchId: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<Result | null, FormData>(saveProduct, null);

  useEffect(() => {
    if (state?.ok) router.push("/admin/inventory/products");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="branchId" value={branchId} />

      {state?.message && !state.ok && (
        <div
          role="alert"
          className="rounded-sm border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </div>
      )}

      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Identity</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input
            name="name"
            label="Product name"
            required
            autoFocus
            defaultValue={product?.name}
            error={state?.errors?.name}
          />
          <Input
            name="sku"
            label="SKU"
            required
            defaultValue={product?.sku}
            hint="Must be unique. Used to reconcile stock against invoices."
            error={state?.errors?.sku}
          />
          <Select
            name="category"
            label="Category"
            required
            defaultValue={product?.category ?? "General Supplies"}
            options={INVENTORY_CATEGORIES.map((c) => ({ value: c, label: c }))}
            error={state?.errors?.category}
          />
          <Input name="brand" label="Brand" defaultValue={product?.brand} />
          <Select
            name="supplierId"
            label="Default supplier"
            placeholder="None"
            defaultValue={product?.supplierId}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Input
            name="storageLocation"
            label="Storage location"
            defaultValue={product?.storageLocation}
            placeholder="Fridge 2, shelf B"
          />
        </div>
      </section>

      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Stock &amp; pricing</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            name="unit"
            label="Unit"
            required
            defaultValue={product?.unit ?? "unit"}
            placeholder="vial, ml, box"
            error={state?.errors?.unit}
          />
          <Input
            name="currentStock"
            label="Current stock"
            type="number"
            min={0}
            step="any"
            defaultValue={product?.currentStock ?? 0}
            hint={product ? "Adjust via a stock movement instead" : "Opening balance"}
            disabled={Boolean(product)}
          />
          <Input
            name="minimumStock"
            label="Minimum stock"
            type="number"
            min={0}
            step="any"
            defaultValue={product?.minimumStock ?? 0}
            hint="Triggers the low stock alert"
          />
          <div />
          <Input
            name="purchasePrice"
            label="Purchase price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={product?.purchasePrice ?? 0}
            error={state?.errors?.purchasePrice}
          />
          <Input
            name="sellingPrice"
            label="Selling price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={product?.sellingPrice ?? 0}
            error={state?.errors?.sellingPrice}
          />
        </div>
      </section>

      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Handling</h2>
        <div className="mt-4 space-y-1">
          <Checkbox
            name="isRetail"
            defaultChecked={product?.isRetail ?? false}
            label="Sellable at the point of sale"
            description="Leave off for clinical consumables, which are deducted by the treatment record rather than sold over the counter."
          />
          <Checkbox
            name="requiresBatchTracking"
            defaultChecked={product?.requiresBatchTracking ?? true}
            label="Track batches and expiry"
            description="Required for anything injectable or with a shelf life. Enables FEFO consumption."
          />
          <Checkbox
            name="isActive"
            defaultChecked={product?.isActive ?? true}
            label="Active"
            description="Inactive products stay in the history but cannot be sold or used."
          />
        </div>

        <div className="mt-5">
          <Textarea name="notes" label="Notes" rows={3} defaultValue={product?.notes} />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton isEdit={Boolean(product)} />
      </div>
    </form>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Saving…" : isEdit ? "Save product" : "Create product"}
    </Button>
  );
}
