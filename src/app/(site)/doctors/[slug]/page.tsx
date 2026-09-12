import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { EditorialImage } from "@/components/public/editorial-image";
import { ServiceCard } from "@/components/public/sections/service-card";
import { getDoctorBySlug, getDoctors, getServices, getSettings } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd, physicianSchema } from "@/lib/seo/schema";

export const revalidate = 3600;

export async function generateStaticParams() {
  const doctors = await getDoctors();
  return doctors.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);
  if (!doctor) return { title: "Profile not found" };

  return {
    title: `${doctor.fullName} — ${doctor.title}`,
    description: doctor.bio.split("\n")[0].slice(0, 160),
    alternates: { canonical: `/doctors/${doctor.slug}` },
  };
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [doctor, services, settings] = await Promise.all([
    getDoctorBySlug(slug),
    getServices(),
    getSettings(),
  ]);

  if (!doctor) notFound();

  const treats = services.filter((s) => doctor.serviceIds.includes(s.id)).slice(0, 6);

  return (
    <>
      <JsonLd data={physicianSchema(doctor, settings)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Experts", url: "/doctors" },
          { name: doctor.fullName, url: `/doctors/${doctor.slug}` },
        ])}
      />

      <PageHero
        eyebrow={doctor.title}
        title={doctor.fullName}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Experts", href: "/doctors" },
          { label: doctor.fullName },
        ]}
      />

      <div className="container-editorial section-y">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <EditorialImage
              src={doctor.photoUrl}
              alt={doctor.fullName}
              className="aspect-[3/4] w-full"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />

            <dl className="mt-10 divide-y divide-line-subtle border-y border-line-subtle">
              <ProfileRow label="Qualifications" value={doctor.qualifications.join(", ")} />
              <ProfileRow label="Special interests" value={doctor.specialties.join(", ")} />
              {doctor.yearsExperience && (
                <ProfileRow label="Experience" value={`${doctor.yearsExperience} years`} />
              )}
              {doctor.languages && (
                <ProfileRow label="Languages" value={doctor.languages.join(", ")} />
              )}
              {doctor.consultationFee && (
                <ProfileRow
                  label="Consultation fee"
                  value={`${settings.currencySymbol} ${doctor.consultationFee.toLocaleString("en-PK")}`}
                />
              )}
            </dl>

            <ButtonLink href="/book" fullWidth size="lg" className="mt-8">
              Book with {doctor.fullName.split(" ").slice(0, 2).join(" ")}
            </ButtonLink>
          </div>

          <div className="lg:col-span-7">
            <div className="space-y-6 text-[1.0625rem] leading-relaxed text-ink-muted">
              {doctor.bio.split("\n\n").map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
            </div>

            {treats.length > 0 && (
              <section className="mt-16">
                <h2 className="font-display text-display-sm">Treatments offered</h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  {treats.map((service, i) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      currencySymbol={settings.currencySymbol}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="eyebrow shrink-0">{label}</dt>
      <dd className="text-sm text-ink sm:text-right">{value}</dd>
    </div>
  );
}
