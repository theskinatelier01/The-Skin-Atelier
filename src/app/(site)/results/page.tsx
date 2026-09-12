import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/public/page-hero";
import { BeforeAfterEmpty, BeforeAfterSlider } from "@/components/public/sections/before-after";
import { getPublishedBeforeAfter } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/schema";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Before & After Results",
  description:
    "Before and after results from The Skin Atelier, Islamabad — published only with the explicit written consent of each patient. Results vary from person to person.",
  alternates: { canonical: "/results" },
};

export default async function ResultsPage() {
  const cases = await getPublishedBeforeAfter();

  // Group by treatment so a visitor can scan for their own concern.
  const byService = cases.reduce<Record<string, typeof cases>>((acc, item) => {
    (acc[item.serviceName] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Results", url: "/results" },
        ])}
      />

      <PageHero
        eyebrow="Results"
        title="Before & after."
        description="Every photograph here is published with the explicit written permission of the patient concerned, and that permission can be withdrawn at any time."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Results" }]}
      />

      <div className="container-editorial section-y">
        {/* Honest framing, placed before the images rather than after them. */}
        <div className="mb-16 flex gap-4 border border-line-subtle bg-canvas-sunken p-6 sm:p-8">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-champagne-500"
          />
          <div className="text-sm leading-relaxed text-ink-muted">
            <p className="font-medium text-ink">How to read these images</p>
            <p className="mt-2">
              These are individual outcomes, not a prediction of yours. Results vary considerably
              with skin type, age, the condition being treated, the number of sessions completed
              and how closely aftercare is followed. Photographs are taken under standardised
              lighting without retouching. What is achievable for you is determined by a clinician
              at consultation.
            </p>
          </div>
        </div>

        {cases.length === 0 ? (
          <BeforeAfterEmpty />
        ) : (
          <div className="space-y-20">
            {Object.entries(byService).map(([serviceName, items]) => (
              <section key={serviceName}>
                <div className="flex items-baseline justify-between gap-6 border-b border-line-subtle pb-5">
                  <h2 className="font-display text-display-sm">{serviceName}</h2>
                  <p className="shrink-0 text-xs tabular-nums text-ink-subtle">
                    {items.length} {items.length === 1 ? "case" : "cases"}
                  </p>
                </div>

                <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, i) => (
                    <Reveal key={item.id} delay={(i % 3) * 90}>
                      <BeforeAfterSlider item={item} />
                    </Reveal>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
