import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/public/page-hero";
import { EditorialImage } from "@/components/public/editorial-image";
import { getDoctors } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our Experts — Dermatologists & Aesthetic Physicians",
  description:
    "Meet the clinicians at The Skin Atelier, Islamabad. Qualified dermatologists and aesthetic physicians who plan and deliver your treatment personally.",
  alternates: { canonical: "/doctors" },
};

export default async function DoctorsPage() {
  const doctors = await getDoctors();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Experts", url: "/doctors" },
        ])}
      />

      <PageHero
        eyebrow="Our experts"
        title="The people who will treat you."
        description="You will meet the clinician who plans your treatment, and they will be the one who delivers it. No handovers, no rotating practitioners."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Experts" }]}
      />

      <div className="container-editorial section-y">
        <div className="space-y-20 lg:space-y-28">
          {doctors.map((doctor, i) => (
            <Reveal key={doctor.id}>
              <article className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                <div className={i % 2 === 1 ? "lg:order-2 lg:col-span-5" : "lg:col-span-5"}>
                  <Link href={`/doctors/${doctor.slug}`} className="group block">
                    <EditorialImage
                      src={doctor.photoUrl}
                      alt={doctor.fullName}
                      className="aspect-[3/4] w-full"
                      imgClassName="transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      tone={i}
                    />
                  </Link>
                </div>

                <div className={i % 2 === 1 ? "lg:order-1 lg:col-span-7" : "lg:col-span-7"}>
                  <p className="eyebrow">{doctor.title}</p>
                  <h2 className="mt-4 font-display text-display-md">
                    <Link href={`/doctors/${doctor.slug}`} className="link-reveal">
                      {doctor.fullName}
                      <span className="link-reveal-line" />
                    </Link>
                  </h2>

                  <p className="mt-6 text-[1.0625rem] leading-relaxed text-ink-muted">
                    {doctor.bio.split("\n\n")[0]}
                  </p>

                  <dl className="mt-9 grid gap-x-10 gap-y-6 border-t border-line-subtle pt-8 sm:grid-cols-2">
                    <div>
                      <dt className="eyebrow">Qualifications</dt>
                      <dd className="mt-2 text-sm text-ink">{doctor.qualifications.join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow">Special interests</dt>
                      <dd className="mt-2 text-sm text-ink">{doctor.specialties.join(", ")}</dd>
                    </div>
                    {doctor.yearsExperience && (
                      <div>
                        <dt className="eyebrow">Experience</dt>
                        <dd className="mt-2 text-sm text-ink">{doctor.yearsExperience} years</dd>
                      </div>
                    )}
                    {doctor.languages && (
                      <div>
                        <dt className="eyebrow">Languages</dt>
                        <dd className="mt-2 text-sm text-ink">{doctor.languages.join(", ")}</dd>
                      </div>
                    )}
                  </dl>

                  <Link
                    href={`/doctors/${doctor.slug}`}
                    className="group mt-8 inline-flex items-center gap-2 text-sm text-ink"
                  >
                    <span className="link-reveal">
                      Read full profile
                      <span className="link-reveal-line" />
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
