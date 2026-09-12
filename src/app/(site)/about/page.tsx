import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/primitives";
import { PageHero } from "@/components/public/page-hero";
import { EditorialImage } from "@/components/public/editorial-image";
import { getDoctors, getSettings } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About the Clinic",
  description:
    "The Skin Atelier is a consultation-led skin and aesthetic clinic in F-11 Markaz, Islamabad, where every treatment plan begins with a diagnosis.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    title: "Diagnosis before treatment",
    body: "We establish what is actually happening in your skin before we propose anything. A treatment that addresses the wrong cause is worse than no treatment, because it costs you time as well as money.",
  },
  {
    title: "We will tell you no",
    body: "If a treatment will not achieve what you are hoping for, we say so. If you do not need anything, we say that too. Declining to sell is part of the service.",
  },
  {
    title: "Conservative by default",
    body: "Particularly with injectables, we treat in stages and review between them. It is always possible to add more. It is considerably harder to undo too much.",
  },
  {
    title: "Your data stays yours",
    body: "Clinical records and photographs are confidential. Nothing is published, shared or used in marketing without your explicit, written and revocable consent.",
  },
];

export default async function AboutPage() {
  const [settings, doctors] = await Promise.all([getSettings(), getDoctors()]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "About", url: "/about" },
        ])}
      />

      <PageHero
        eyebrow="About"
        title="A quieter kind of aesthetic medicine."
        description="The Skin Atelier was founded on the conviction that aesthetic medicine belongs in clinical hands — and that the most valuable thing a clinic can offer is an honest assessment."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      {/* Story */}
      <section className="container-editorial section-y">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-7">
            <div className="space-y-6 text-[1.0625rem] leading-relaxed text-ink-muted">
              <p>
                Aesthetic medicine in Pakistan has grown quickly, and not always carefully. Devices
                arrive faster than the training to use them properly, and treatments are frequently
                sold by people who will not be the ones delivering them.
              </p>
              <p>
                We built {settings.clinicName} as a deliberate counterweight to that. Every patient
                is assessed by a qualified clinician, every plan is written down before it starts,
                and the person who plans your treatment is the person who carries it out.
              </p>
              <p>
                A great deal of our work is with South Asian skin, where the margin between a
                treatment that helps and one that causes lasting pigmentation is narrow. That is not
                a detail to be managed with a standard protocol — it is the central clinical
                consideration, and it shapes how we select devices, depths and formulations.
              </p>
              <p>
                The result is a clinic that is smaller, slower and more selective than it could be.
                We are comfortable with that.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-5">
            <EditorialImage
              alt="The Skin Atelier consultation room"
              className="aspect-[4/5] w-full"
              sizes="(max-width: 1024px) 100vw, 40vw"
              tone={1}
            />
          </Reveal>
        </div>
      </section>

      {/* Principles */}
      <section className="border-y border-line-subtle bg-canvas-sunken">
        <div className="container-editorial section-y">
          <Reveal>
            <SectionHeading
              eyebrow="How we work"
              title="Four principles we do not compromise on."
              as="h2"
            />
          </Reveal>

          <ul className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <Reveal as="li" key={p.title} delay={(i % 2) * 100}>
                <span
                  aria-hidden="true"
                  className="font-display text-3xl text-champagne-400"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-xl text-ink">{p.title}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-muted">{p.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Team */}
      <section className="container-editorial section-y">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading eyebrow="The team" title="Who you will meet." as="h2" />
          <ButtonLink href="/doctors" variant="outline" iconRight={<ArrowRight />}>
            Full profiles
          </ButtonLink>
        </Reveal>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor, i) => (
            <Reveal key={doctor.id} delay={i * 90}>
              <EditorialImage
                src={doctor.photoUrl}
                alt={doctor.fullName}
                className="aspect-[3/4] w-full"
                sizes="(max-width: 640px) 100vw, 33vw"
                tone={i}
              />
              <h3 className="mt-6 font-display text-xl">{doctor.fullName}</h3>
              <p className="eyebrow mt-2">{doctor.title}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Visit */}
      <section className="border-t border-line-subtle bg-canvas-inverse text-ivory-100">
        <div className="container-editorial section-y-sm">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="eyebrow text-ivory-100/55">Visit</p>
              <h2 className="mt-5 font-display text-display-md text-white">
                F-11 Markaz, Islamabad.
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-ivory-100/70">
                {settings.addressLine}, {settings.city}. Parking is available at the Markaz, and the
                clinic is a short walk from the main commercial strip.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/book" variant="accent">
                  Book a consultation
                </ButtonLink>
                <ButtonLink
                  href="/contact"
                  variant="outline"
                  className="border-white/40 text-white hover:border-white hover:bg-white/10"
                >
                  Directions &amp; contact
                </ButtonLink>
              </div>
            </div>

            <EditorialImage
              alt="Clinic exterior at F-11 Markaz"
              className="aspect-[3/2] w-full"
              sizes="(max-width: 1024px) 100vw, 50vw"
              tone={3}
            />
          </div>
        </div>
      </section>
    </>
  );
}
