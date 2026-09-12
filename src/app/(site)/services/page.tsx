import type { Metadata } from "next";

import { PageHero } from "@/components/public/page-hero";
import { ServiceCard } from "@/components/public/sections/service-card";
import { Reveal } from "@/components/ui/reveal";
import { getServiceCategories, getServices, getSettings } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Treatments — Dermatology & Aesthetics in Islamabad",
  description:
    "Explore the full treatment menu at The Skin Atelier, Islamabad: injectables, skin and laser treatments, hair restoration, facials and medical dermatology.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const [services, categories, settings] = await Promise.all([
    getServices(),
    getServiceCategories(),
    getSettings(),
  ]);

  // Only render a category heading where the category actually has services.
  const grouped = categories
    .map((category) => ({
      category,
      services: services.filter((s) => s.categoryId === category.id && s.showInCategory),
    }))
    .filter((group) => group.services.length > 0);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Treatments", url: "/services" },
        ])}
      />

      <PageHero
        eyebrow="Treatments"
        title="Our treatment menu."
        description="Every treatment listed here begins with a consultation. What suits you depends on your skin, your medical history and what you are trying to achieve — which is why we assess before we recommend."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Treatments" }]}
      />

      {/* In-page category navigation. */}
      <nav
        aria-label="Treatment categories"
        className="sticky top-16 z-20 border-b border-line-subtle bg-canvas/95 backdrop-blur-md lg:top-[4.5rem]"
      >
        <div className="container-editorial">
          <ul className="rail-scroll flex gap-6 overflow-x-auto py-4">
            {grouped.map(({ category, services: list }) => (
              <li key={category.id}>
                <a
                  href={`#${category.slug}`}
                  className="link-reveal flex items-center gap-2 whitespace-nowrap text-[0.8125rem] text-ink-muted transition-colors hover:text-ink"
                >
                  {category.name}
                  <span className="text-[0.625rem] tabular-nums text-ink-subtle">{list.length}</span>
                  <span className="link-reveal-line" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="container-editorial section-y">
        <div className="space-y-24">
          {grouped.map(({ category, services: list }) => (
            <section key={category.id} id={category.slug} className="scroll-mt-36">
              <div className="flex items-baseline justify-between gap-6 border-b border-line-subtle pb-6">
                <h2 className="font-display text-display-sm">{category.name}</h2>
                <p className="shrink-0 text-xs tabular-nums text-ink-subtle">
                  {list.length} {list.length === 1 ? "treatment" : "treatments"}
                </p>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((service, i) => (
                  <Reveal key={service.id} delay={(i % 3) * 80}>
                    <ServiceCard
                      service={service}
                      currencySymbol={settings.currencySymbol}
                      index={i}
                    />
                  </Reveal>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-20 border-t border-line-subtle pt-8 text-xs leading-relaxed text-ink-subtle">
          Prices shown are indicative starting points for a standard treatment and may vary with
          the area treated and the plan agreed at consultation. Results vary from person to person,
          and treatment suitability is determined by a qualified clinician.
        </p>
      </div>
    </>
  );
}
