import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { requirePermission } from "@/lib/auth/session";
import { getSuppliers } from "@/lib/admin/queries";
import { DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";

export const metadata = { title: "New Product" };

export default async function NewProductPage() {
  await requirePermission("inventory.write");
  const suppliers = await getSuppliers();

  return (
    <>
      <AdminPageHeader
        title="New product"
        description="Add a consumable or retail item. Stock is then moved through the ledger rather than edited directly."
        breadcrumb={[
          { label: "Inventory", href: "/admin" },
          { label: "Products", href: "/admin/inventory/products" },
          { label: "New" },
        ]}
      />
      <div className="max-w-4xl">
        <ProductForm suppliers={suppliers} branchId={DEFAULT_BRANCH_ID} />
      </div>
    </>
  );
}
