import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, RefreshCw, Sparkles, TrendingUp } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PageHero } from "@/components/public/page-hero";
import { EditorialImage } from "@/components/public/editorial-image";
import { ServiceCard } from "@/components/public/sections/service-card";
import { Accordion } from "@/components/public/accordion";
import { getServiceBySlug, getServices, getSettings } from "@/lib/cms/queries";
import { breadcrumbSchema, faqSchema, JsonLd, serviceSchema } from "@/lib/seo/schema";
import { formatCurrency } from "@/lib/utils/format";

export const revalidate = 3600;

/** Pre-renders every active service at build time. */
export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Treatment not found" };

  return {
    title: service.seo?.title ?? `${service.name} in Islamabad`,
    description: service.seo?.description ?? service.shortDescription,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: service.seo?.title ?? service.name,
      description: service.seo?.description ?? service.shortDescription,
      images: service.coverImageUrl ? [service.coverImageUrl] : undefined,
      type: "article",
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, allServices, settings] = await Promise.all([
    getServiceBySlug(slug),
    getServices(),
    getSettings(),
  ]);

  if (!service) notFound();

  const related = allServices
    .filter((s) => service.relatedServiceIds.includes(s.id) && s.id !== service.id)
    .slice(0, 3);

  return (
    <>
      <JsonLd data={serviceSchema(service, settings)} />
      {service.faqs.length > 0 && <JsonLd data={faqSchema(service.faqs)} />}
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Treatments", url: "/services" },
          { name: service.name, url: `/services/${service.slug}` },
        ])}
      />

      <PageHero
        eyebrow={service.categoryName}
        title={service.name}
        description={service.shortDescription}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Treatments", href: "/services" },
          { label: service.name },
        ]}
      >
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink href="/book" iconRight={<ArrowRight />}>
            Book a consultation
          </ButtonLink>
          <ButtonLink href="/contact" variant="outline">
            Ask a question
          </ButtonLink>
        </div>
      </PageHero>

      {/* Key facts */}
      <section aria-label="Treatment summary" className="border-b border-line-subtle">
        <div className="container-editorial">
          <dl className="grid divide-line-subtle sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
            <Fact icon={<Clock className="size-4" />} label="Duration">
              {service.durationMinutes} minutes
            </Fact>
            <Fact icon={<RefreshCw className="size-4" />} label="Downtime">
              {service.downtime}
            </Fact>
            <Fact icon={<TrendingUp className="size-4" />} label="Results">
              {service.resultsTimeline}
            </Fact>
            <Fact icon={<Sparkles className="size-4" />} label="Sessions">
              {service.recommendedSessions}
            </Fact>
          </dl>
        </div>
      </section>

      <div className="container-editorial section-y">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
          {/* Main column */}
          <div className="lg:col-span-7">
            <EditorialImage
              src={service.coverImageUrl}
              alt={service.name}
              className="aspect-[3/2] w-full"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
            />

            <div className="mt-12 space-y-5 text-[1.0625rem] leading-relaxed text-ink-muted">
              {service.detailedDescription.split("\n\n").map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
            </div>

            {service.benefits.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-display-sm">Benefits</h2>
                <ul className="mt-7 space-y-3.5">
                  {service.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-3.5">
                      <Check
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-champagne-500"
                      />
                      <span className="text-ink-muted">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {service.treatmentProcess.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-display-sm">What happens during treatment</h2>
                <ol className="mt-8 space-y-0">
                  {service.treatmentProcess.map((step) => (
                    <li
                      key={step.step}
                      className="flex gap-6 border-b border-line-subtle py-6 last:border-b-0"
                    >
                      <span
                        aria-hidden="true"
                        className="font-display text-2xl leading-none text-champagne-400"
                      >
                        {String(step.step).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-medium text-ink">{step.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {service.faqs.length > 0 && (
              <section className="mt-14">
                <h2 className="font-display text-display-sm">Common questions</h2>
                <div className="mt-8">
                  <Accordion
                    items={service.faqs.map((f, i) => ({
                      id: `faq-${i}`,
                      question: f.question,
                      answer: f.answer,
                    }))}
                  />
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="border border-line-subtle bg-canvas-raised p-8">
                <p className="eyebrow">{service.priceOnConsultation ? "Pricing" : "From"}</p>
                <p className="mt-3 font-display text-display-sm text-ink">
                  {service.priceOnConsultation
                    ? "On consultation"
                    : formatCurrency(
                        service.discountedPrice ?? service.price,
                        settings.currencySymbol,
                      )}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                  {service.priceOnConsultation
                    ? "This treatment is priced after assessment, because the plan depends on what we find at consultation. You will receive a written plan and cost before committing."
                    : "Indicative starting price for a standard treatment. Your final cost is confirmed at consultation."}
                </p>

                <ButtonLink href="/book" fullWidth size="lg" className="mt-7">
                  Book a consultation
                </ButtonLink>
                <ButtonLink
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  variant="outline"
                  fullWidth
                  className="mt-3"
                >
                  Call {settings.phone}
                </ButtonLink>
              </div>

              {service.suitableFor.length > 0 && (
                <div className="mt-8 border border-line-subtle p-8">
                  <h2 className="font-display text-lg">Often suitable for</h2>
                  <ul className="mt-5 space-y-3">
                    {service.suitableFor.map((item) => (
                      <li key={item} className="flex gap-3 text-sm text-ink-muted">
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1 shrink-0 rounded-full bg-champagne-400"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-line-subtle pt-5 text-xs leading-relaxed text-ink-subtle">
                    This is general guidance, not a diagnosis. Whether this treatment is right for
                    you is determined by a clinician at consultation.
                  </p>
                </div>
              )}

              {service.concernTags.length > 0 && (
                <div className="mt-8">
                  <p className="eyebrow">Addresses</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {service.concernTags.map((tag) => (
                      <li
                        key={tag}
                        className="border border-line px-3 py-1.5 text-xs text-ink-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line-subtle bg-canvas-sunken">
          <div className="container-editorial section-y-sm">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-display text-display-sm">Related treatments</h2>
              <Link href="/services" className="link-reveal text-sm text-ink-muted">
                All treatments
                <span className="link-reveal-line" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s, i) => (
                <Reveal key={s.id} delay={i * 80}>
                  <ServiceCard service={s} currencySymbol={settings.currencySymbol} index={i} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line-subtle px-0 py-6 last:border-b-0 sm:border-b-0 lg:px-8 lg:first:pl-0">
      <dt className="flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.2em] text-ink-subtle">
        <span aria-hidden="true" className="text-champagne-500">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-2 text-sm text-ink">{children}</dd>
    </div>
  );
}
