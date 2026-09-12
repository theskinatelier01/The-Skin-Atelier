import Link from "next/link";
import { Lock, Syringe } from "lucide-react";

import { EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { requirePermission } from "@/lib/auth/session";
import { getTreatments } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Treatments" };

export default async function TreatmentsPage() {
  await requirePermission("treatments.read");
  const treatments = await getTreatments(100);

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Treatment Records"
        description="Every completed treatment, including the products and batches consumed. Clinical photographs stay private to the record."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Treatments" }]}
      />

      <AdminSection title="Recent treatments" description={`${treatments.length} recorded`}>
        {treatments.length === 0 ? (
          <EmptyState
            icon={<Syringe />}
            title="No treatment records"
            description="A record is created when a clinician completes a treatment during an appointment."
          />
        ) : (
          <TableWrap className="rounded-none border-0">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Patient</Th>
                  <Th>Treatment</Th>
                  <Th>Area</Th>
                  <Th align="right">Session</Th>
                  <Th>Clinician</Th>
                  <Th>Products used</Th>
                  <Th>Images</Th>
                </tr>
              </thead>
              <tbody>
                {treatments.map((t) => {
                  const imageCount =
                    (t.beforeImagePaths?.length ?? 0) + (t.afterImagePaths?.length ?? 0);
                  return (
                    <Tr key={t.id}>
                      <Td className="whitespace-nowrap text-ink-muted">{formatDate(t.date)}</Td>
                      <Td>
                        <Link
                          href={`/admin/clinic/patients/${t.patientId}`}
                          className="font-medium hover:underline"
                        >
                          {t.patientName}
                        </Link>
                      </Td>
                      <Td>{t.serviceName}</Td>
                      <Td className="text-ink-muted">{t.treatmentArea}</Td>
                      <Td align="right">{t.sessionNumber}</Td>
                      <Td className="text-ink-muted">{t.doctorName}</Td>
                      <Td className="text-xs text-ink-muted">
                        {t.productsUsed?.length
                          ? t.productsUsed
                              .map((p) => `${p.productName} ${p.quantity}${p.unit}`)
                              .join(", ")
                          : "—"}
                      </Td>
                      <Td>
                        {imageCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-ink-subtle">
                            <Lock className="size-3" aria-hidden="true" />
                            {imageCount}
                          </span>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
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
