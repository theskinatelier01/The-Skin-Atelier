import Link from "next/link";
import { notFound } from "next/navigation";
import { Layers } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import { fromSnapshot } from "@/lib/firebase/convert";
import { getSettings } from "@/lib/cms/queries";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PatientPackage } from "@/types";

export const metadata = { title: "Patient Packages" };
export const dynamic = "force-dynamic";

async function listPatientPackages(): Promise<PatientPackage[]> {
  if (!isAdminConfigured) return [];
  try {
    const snap = await adminDb()
      .collection(C.patientPackages)
      .orderBy("purchaseDate", "desc")
      .limit(200)
      .get();
    return snap.docs.map((doc) => fromSnapshot<PatientPackage>(doc));
  } catch {
    return [];
  }
}

/**
 * Packages held by patients.
 *
 * Tracks sessions used against sessions bought, so a patient can always be told
 * exactly what remains and when it expires.
 */
export default async function PatientPackagesPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "packages.read")) notFound();

  const [packages, settings] = await Promise.all([listPatientPackages(), getSettings()]);
  const active = packages.filter((p) => p.status === "Active");
  const expiringSoon = active.filter(
    (p) => new Date(p.expiryDate).getTime() < Date.now() + 30 * 86_400_000,
  );

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Patient Packages"
        description="Courses bought by patients, with sessions used and remaining."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Patient Packages" }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Packages sold" value={packages.length} icon={<Layers />} />
        <StatCard label="Active" value={active.length} tone="positive" />
        <StatCard
          label="Expiring within 30 days"
          value={expiringSoon.length}
          tone={expiringSoon.length > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="mt-5">
        <AdminSection title="All packages" description={`${packages.length} recorded`}>
          {packages.length === 0 ? (
            <EmptyState
              icon={<Layers />}
              title="No packages sold yet"
              description="Selling a package at the point of sale creates a tracked course here."
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Patient</Th>
                    <Th>Package</Th>
                    <Th>Purchased</Th>
                    <Th>Expires</Th>
                    <Th align="right">Used</Th>
                    <Th align="right">Remaining</Th>
                    <Th align="right">Paid</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => {
                    const remaining = pkg.sessionsTotal - pkg.sessionsUsed;
                    return (
                      <Tr key={pkg.id}>
                        <Td>
                          <Link
                            href={`/admin/clinic/patients/${pkg.patientId}`}
                            className="font-medium hover:underline"
                          >
                            {pkg.patientName}
                          </Link>
                        </Td>
                        <Td>{pkg.packageName}</Td>
                        <Td className="whitespace-nowrap text-ink-muted">
                          {formatDate(pkg.purchaseDate)}
                        </Td>
                        <Td className="whitespace-nowrap text-ink-muted">
                          {formatDate(pkg.expiryDate)}
                        </Td>
                        <Td align="right">{pkg.sessionsUsed}</Td>
                        <Td align="right" className={remaining === 0 ? "text-ink-subtle" : ""}>
                          {remaining}
                        </Td>
                        <Td align="right">
                          {formatCurrency(pkg.pricePaid, settings.currencySymbol)}
                        </Td>
                        <Td>
                          <Badge
                            tone={
                              pkg.status === "Active"
                                ? "success"
                                : pkg.status === "Expired"
                                  ? "danger"
                                  : "neutral"
                            }
                            dot
                          >
                            {pkg.status}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </AdminSection>
      </div>
    </>
  );
}
