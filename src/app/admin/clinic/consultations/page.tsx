import Link from "next/link";
import { Stethoscope } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { requirePermission } from "@/lib/auth/session";
import { getConsultations } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Consultations" };

export default async function ConsultationsPage() {
  await requirePermission("consultations.read");
  const consultations = await getConsultations(100);

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Consultations"
        description="Clinical assessments and treatment plans. Access is restricted to clinical staff."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Consultations" }]}
      />

      <AdminSection title="Recent consultations" description={`${consultations.length} recorded`}>
        {consultations.length === 0 ? (
          <EmptyState
            icon={<Stethoscope />}
            title="No consultations recorded"
            description="A consultation is created by a clinician when they open a patient record during an appointment."
          />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {consultations.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <Link
                    href={`/admin/clinic/patients/${c.patientId}`}
                    className="text-sm font-medium text-ink hover:underline"
                  >
                    {c.patientName}
                  </Link>
                  <span className="text-xs text-ink-subtle">{formatDate(c.date)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{c.chiefConcern}</p>
                <p className="mt-1.5 text-xs text-ink-subtle">{c.doctorName}</p>

                {c.recommendedServiceNames?.length > 0 && (
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {c.recommendedServiceNames.map((name) => (
                      <li key={name}>
                        <Badge tone="accent">{name}</Badge>
                      </li>
                    ))}
                  </ul>
                )}

                {c.followUpDate && (
                  <p className="mt-2 text-xs text-ink-subtle">
                    Follow-up due {formatDate(c.followUpDate)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </>
  );
}
