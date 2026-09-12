import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PosTerminal } from "@/components/admin/pos-terminal";
import { requirePermission } from "@/lib/auth/session";
import { getPatients, getProducts } from "@/lib/admin/queries";
import { getPackages, getServices, getSettings } from "@/lib/cms/queries";

export const metadata = { title: "Point of Sale" };

export default async function PosPage() {
  await requirePermission("pos.use");

  const [patients, products, services, packages, settings] = await Promise.all([
    getPatients(200),
    getProducts(),
    getServices(),
    getPackages(),
    getSettings(),
  ]);

  // Only retail products are sellable; clinical consumables are deducted by
  // the treatment record, not sold over the counter.
  const sellable = products.filter((p) => p.isRetail && p.isActive && p.currentStock > 0);

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Point of Sale"
        description="Sell treatments, packages and retail products. Stock is deducted on the batch closest to expiry."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Point of Sale" }]}
      />

      <PosTerminal
        patients={patients.map((p) => ({
          id: p.id,
          name: p.fullName,
          phone: p.phone,
          code: p.patientCode,
        }))}
        services={services
          .filter((s) => s.isActive)
          .map((s) => ({
            id: s.id,
            name: s.name,
            price: s.discountedPrice ?? s.price ?? 0,
            category: s.categoryName,
            onConsultation: s.priceOnConsultation,
          }))}
        packages={packages.map((p) => ({ id: p.id, name: p.name, price: p.price }))}
        products={sellable.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.sellingPrice,
          stock: p.currentStock,
          unit: p.unit,
        }))}
        currencySymbol={settings.currencySymbol}
        taxPercent={settings.taxPercent}
      />
    </>
  );
}
