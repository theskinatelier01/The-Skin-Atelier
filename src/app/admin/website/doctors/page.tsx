import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, UserRound } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasAnyPermission } from "@/lib/auth/permissions";
import { getDoctors } from "@/lib/cms/queries";

export const metadata = { title: "Doctors" };
export const dynamic = "force-dynamic";

export default async function AdminDoctorsPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasAnyPermission(ctx, ["doctors.write", "cms.pages.read"])) notFound();

  const doctors = await getDoctors();

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Doctors"
        description="Public clinician profiles. These also populate the booking form and the appointment diary."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Doctors" }]}
      />

      <AdminSection title="Published profiles" description={`${doctors.length} clinicians`}>
        {doctors.length === 0 ? (
          <EmptyState
            icon={<UserRound />}
            title="No clinician profiles"
            description="Add the clinicians who see patients so they appear on the website and in the diary."
          />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {doctors.map((doctor) => (
              <li key={doctor.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{doctor.fullName}</p>
                    <Badge tone={doctor.isPublished ? "success" : "neutral"} dot>
                      {doctor.isPublished ? "Live" : "Hidden"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-subtle">{doctor.title}</p>
                  <p className="mt-2 text-sm text-ink-muted">{doctor.specialties.join(" · ")}</p>
                  <p className="mt-1 text-xs text-ink-subtle">
                    {doctor.qualifications.join(", ")}
                    {doctor.yearsExperience ? ` · ${doctor.yearsExperience} years` : ""}
                    {` · ${doctor.serviceIds.length} treatments offered`}
                  </p>
                </div>

                <Link
                  href={`/doctors/${doctor.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open the profile for ${doctor.fullName}`}
                  className="grid size-9 shrink-0 place-items-center rounded-sm border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </>
  );
}
