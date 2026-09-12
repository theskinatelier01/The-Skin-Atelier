import { notFound } from "next/navigation";
import { Layers } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getPackages, getSettings } from "@/lib/cms/queries";
import { formatCurrency } from "@/lib/utils/format";

export const metadata = { title: "Packages" };
export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "packages.read")) notFound();

  const [packages, settings] = await Promise.all([getPackages(), getSettings()]);

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Packages"
        description="Multi-session courses sold at a discount. Sessions are tracked against each patient once purchased."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Packages" }]}
      />

      <AdminSection title="All packages" description={`${packages.length} available`}>
        {packages.length === 0 ? (
          <EmptyState
            icon={<Layers />}
            title="No packages"
            description="Create a package where a treatment is naturally delivered over several sessions."
          />
        ) : (
          <TableWrap className="rounded-none border-0">
            <Table>
              <thead>
                <tr>
                  <Th>Package</Th>
                  <Th>Includes</Th>
                  <Th align="right">Sessions</Th>
                  <Th align="right">Price</Th>
                  <Th align="right">Saving</Th>
                  <Th align="right">Validity</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => {
                  const saving =
                    pkg.compareAtPrice && pkg.compareAtPrice > pkg.price
                      ? Math.round(((pkg.compareAtPrice - pkg.price) / pkg.compareAtPrice) * 100)
                      : null;
                  return (
                    <Tr key={pkg.id}>
                      <Td>
                        <span className="font-medium">{pkg.name}</span>
                        <span className="block font-mono text-xs text-ink-subtle">
                          /packages#{pkg.slug}
                        </span>
                      </Td>
                      <Td className="text-ink-muted">
                        {pkg.items.map((i) => `${i.serviceName} x${i.sessions}`).join(", ")}
                      </Td>
                      <Td align="right">{pkg.totalSessions}</Td>
                      <Td align="right">{formatCurrency(pkg.price, settings.currencySymbol)}</Td>
                      <Td align="right" className={saving ? "text-success" : "text-ink-subtle"}>
                        {saving ? `${saving}%` : "—"}
                      </Td>
                      <Td align="right" className="text-ink-muted">
                        {Math.round(pkg.validityDays / 30)} months
                      </Td>
                      <Td>
                        <div className="flex gap-1.5">
                          <Badge tone={pkg.isActive ? "success" : "neutral"} dot>
                            {pkg.isActive ? "Live" : "Hidden"}
                          </Badge>
                          {pkg.isFeatured && <Badge tone="accent">Featured</Badge>}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </AdminSection>
    </>
  );
}
