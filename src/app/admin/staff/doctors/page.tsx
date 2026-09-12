import { notFound } from "next/navigation";
import { Stethoscope } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getDoctors, getSettings } from "@/lib/cms/queries";
import { formatCurrency } from "@/lib/utils/format";

export const metadata = { title: "Doctors" };
export const dynamic = "force-dynamic";

export default async function StaffDoctorsPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "doctors.write")) notFound();

  const [doctors, settings] = await Promise.all([getDoctors(), getSettings()]);

  return (
    <>
      <AdminPageHeader
        title="Doctors"
        description="Clinician records used by the appointment diary, the consultation module and the public profiles."
        breadcrumb={[{ label: "Staff", href: "/admin" }, { label: "Doctors" }]}
      />

      <AdminSection title="Clinicians" description={`${doctors.length} recorded`}>
        {doctors.length === 0 ? (
          <EmptyState icon={<Stethoscope />} title="No clinicians recorded" />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {doctors.map((doctor) => (
              <li key={doctor.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">{doctor.fullName}</p>
                      <Badge tone={doctor.isPublished ? "success" : "neutral"} dot>
                        {doctor.isPublished ? "On the website" : "Internal only"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-subtle">{doctor.title}</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      {doctor.specialties.join(" · ")}
                    </p>
                  </div>

                  <dl className="flex shrink-0 gap-8 text-right">
                    <div>
                      <dt className="text-[0.625rem] uppercase tracking-[0.14em] text-ink-subtle">
                        Consultation
                      </dt>
                      <dd className="mt-1 text-sm tabular-nums text-ink">
                        {doctor.consultationFee
                          ? formatCurrency(doctor.consultationFee, settings.currencySymbol)
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.625rem] uppercase tracking-[0.14em] text-ink-subtle">
                        Treatments
                      </dt>
                      <dd className="mt-1 text-sm tabular-nums text-ink">
                        {doctor.serviceIds.length}
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </>
  );
}
