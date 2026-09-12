import type { Metadata } from "next";
import { Check } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/public/page-hero";
import { getPackages, getSettings } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/schema";
import { formatCurrency } from "@/lib/utils/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Treatment Packages & Memberships",
  description:
    "Treatment packages at The Skin Atelier, Islamabad — bridal preparation, skin rejuvenation, acne recovery, hair restoration and monthly skin memberships.",
  alternates: { canonical: "/packages" },
};

export default async function PackagesPage() {
  const [packages, settings] = await Promise.all([getPackages(), getSettings()]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Packages", url: "/packages" },
        ])}
      />

      <PageHero
        eyebrow="Packages"
        title="Courses, priced as courses."
        description="Some treatments only work properly over several sessions. Where that is the case, a package costs meaningfully less than booking each session individually."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Packages" }]}
      />

      <div className="container-editorial section-y">
        <div className="grid gap-8 lg:grid-cols-2">
          {packages.map((pkg, i) => {
            const saving =
              pkg.compareAtPrice && pkg.compareAtPrice > pkg.price
                ? Math.round(((pkg.compareAtPrice - pkg.price) / pkg.compareAtPrice) * 100)
                : null;

            return (
              <Reveal key={pkg.id} delay={(i % 2) * 90}>
                <article className="flex h-full flex-col border border-line-subtle bg-canvas-raised p-8 transition-shadow duration-500 hover:shadow-lifted sm:p-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {pkg.isFeatured && <p className="eyebrow">Most requested</p>}
                      <h2 className="mt-2 font-display text-display-sm">{pkg.name}</h2>
                    </div>
                    {saving && (
                      <span className="shrink-0 border border-champagne-300 bg-ivory-300 px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-gold-700">
                        Save {saving}%
                      </span>
                    )}
                  </div>

                  <p className="mt-5 leading-relaxed text-ink-muted">{pkg.description}</p>

                  <ul className="mt-8 space-y-3 border-t border-line-subtle pt-7">
                    {pkg.items.map((item) => (
                      <li key={item.serviceId} className="flex items-start gap-3 text-sm">
                        <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-champagne-500" />
                        <span className="flex-1 text-ink-muted">{item.serviceName}</span>
                        <span className="shrink-0 tabular-nums text-ink">
                          {item.sessions} {item.sessions === 1 ? "session" : "sessions"}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-2 border-t border-line-subtle pt-6 text-xs text-ink-subtle">
                    <div className="flex gap-1.5">
                      <dt>Total sessions:</dt>
                      <dd className="text-ink">{pkg.totalSessions}</dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt>Valid for:</dt>
                      <dd className="text-ink">{Math.round(pkg.validityDays / 30)} months</dd>
                    </div>
                  </dl>

                  <div className="mt-auto pt-8">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-display-sm text-ink">
                        {formatCurrency(pkg.price, settings.currencySymbol)}
                      </span>
                      {pkg.compareAtPrice && (
                        <span className="text-sm text-ink-subtle line-through">
                          {formatCurrency(pkg.compareAtPrice, settings.currencySymbol)}
                        </span>
                      )}
                    </div>

                    {pkg.terms && (
                      <p className="mt-4 text-xs leading-relaxed text-ink-subtle">{pkg.terms}</p>
                    )}

                    <ButtonLink href="/book" fullWidth size="lg" className="mt-6">
                      Enquire about this package
                    </ButtonLink>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-16 border-t border-line-subtle pt-8 text-xs leading-relaxed text-ink-subtle">
          Package sessions are tracked against your patient record, so you can always see how many
          remain and when they expire. Packages are non-transferable. Suitability for every
          treatment included is confirmed at consultation, and where a treatment turns out not to
          suit you we will substitute or refund the unused portion.
        </p>
      </div>
    </>
  );
}
