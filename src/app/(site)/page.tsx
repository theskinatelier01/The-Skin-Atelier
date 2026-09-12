import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, MessageCircle, Phone, ShieldCheck, Sparkles, Star, Stethoscope } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { EditorialImage } from "@/components/public/editorial-image";
import { Hero } from "@/components/public/sections/hero";
import { ServiceCard } from "@/components/public/sections/service-card";
import { ConcernFinder } from "@/components/public/sections/concern-finder";
import { Testimonials } from "@/components/public/sections/testimonials";
import { BeforeAfterEmpty, BeforeAfterSlider } from "@/components/public/sections/before-after";
import {
  getDoctors,
  getGallery,
  getPackages,
  getPublishedBeforeAfter,
  getServices,
  getSettings,
  getTestimonials,
} from "@/lib/cms/queries";
import { formatCurrency, whatsappLink } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "The Skin Atelier — Skin & Aesthetic Clinic in Islamabad",
  description:
    "Consultation-led dermatology and aesthetic treatments in F-11 Markaz, Islamabad. Botox, dermal fillers, PRP, HydraFacial, microneedling, laser and medical skincare.",
  alternates: { canonical: "/" },
};

// The homepage is fully static and revalidated hourly, so CMS edits appear
// without a redeploy while visitors are still served from the edge cache.
export const revalidate = 3600;

export default async function HomePage() {
  const [settings, services, doctors, packages, testimonials, cases, gallery] = await Promise.all([
    getSettings(),
    getServices(),
    getDoctors(),
    getPackages(),
    getTestimonials(),
    getPublishedBeforeAfter(),
    getGallery(),
  ]);

  const homepageServices = services.filter((s) => s.showOnHomepage).slice(0, 6);
  const featured = services.find((s) => s.isFeatured) ?? services[0];
  const featuredPackages = packages.filter((p) => p.isFeatured).slice(0, 3);
  const socialItems = gallery.filter((g) => g.isSocial).slice(0, 6);

  return (
    <>
      <Hero
        settings={settings}
        heading="Where Skin Meets Science."
        subheading="Advanced aesthetic and dermatological care designed around your skin, your confidence and your goals."
      />

      {/* ---------------------------------------------------------------- */}
      {/* Trust                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-line-subtle bg-canvas-sunken" aria-label="Why patients choose us">
        <div className="container-editorial section-y-sm">
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Star className="size-4" />,
                stat: `${settings.googleRating?.toFixed(1)} / 5`,
                label: "Google rating",
                copy: `Rated by ${settings.googleReviewCount} patients in Islamabad.`,
              },
              {
                icon: <Stethoscope className="size-4" />,
                stat: "Qualified clinicians",
                label: "Medically led",
                copy: "Every treatment is planned and delivered by registered practitioners.",
              },
              {
                icon: <Sparkles className="size-4" />,
                stat: "Personalised plans",
                label: "Consultation first",
                copy: "No fixed protocols — your plan is built around your skin and history.",
              },
              {
                icon: <ShieldCheck className="size-4" />,
                stat: "Consent-led",
                label: "Privacy protected",
                copy: "Records and photographs stay confidential unless you permit otherwise.",
              },
            ].map((item, i) => (
              <Reveal as="li" key={item.label} delay={i * 80}>
                <span aria-hidden="true" className="inline-flex text-champagne-500">
                  {item.icon}
                </span>
                <p className="mt-4 font-display text-2xl text-ink">{item.stat}</p>
                <p className="eyebrow mt-2">{item.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.copy}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Featured services                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="container-editorial section-y" aria-labelledby="treatments-heading">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            eyebrow="Treatments"
            title="Considered treatments, delivered properly."
            description="A focused menu of dermatological and aesthetic treatments. Each one begins with an assessment — not a price list."
          />
          <ButtonLink href="/services" variant="outline" iconRight={<ArrowRight />}>
            All treatments
          </ButtonLink>
        </Reveal>
        <h2 id="treatments-heading" className="sr-only">
          Featured treatments
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {homepageServices.map((service, i) => (
            <Reveal key={service.id} delay={(i % 3) * 90}>
              <ServiceCard service={service} currencySymbol={settings.currencySymbol} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Concern finder                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-line-subtle bg-canvas-sunken" aria-labelledby="concerns-heading">
        <div className="container-editorial section-y">
          <Reveal>
            <SectionHeading
              eyebrow="Start here"
              title="What are you looking to improve?"
              description="Choose a concern to see the treatments most often used to address it."
              as="h2"
            />
          </Reveal>
          <h2 id="concerns-heading" className="sr-only">
            Find a treatment by concern
          </h2>

          <div className="mt-14">
            <ConcernFinder services={services} />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Featured treatment — editorial                                    */}
      {/* ---------------------------------------------------------------- */}
      {featured && (
        <section className="container-editorial section-y">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-6">
              <EditorialImage
                src={featured.coverImageUrl}
                alt={featured.name}
                className="aspect-[4/5] w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
                tone={3}
              />
            </Reveal>

            <Reveal delay={120} className="lg:col-span-6">
              <p className="eyebrow">Signature treatment</p>
              <h2 className="mt-5 font-display text-display-md">{featured.name}</h2>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-ink-muted">
                {featured.shortDescription}
              </p>

              <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-line-subtle py-8">
                <div>
                  <dt className="eyebrow">Duration</dt>
                  <dd className="mt-1.5 text-sm text-ink">{featured.durationMinutes} minutes</dd>
                </div>
                <div>
                  <dt className="eyebrow">Downtime</dt>
                  <dd className="mt-1.5 text-sm text-ink">{featured.downtime}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Results</dt>
                  <dd className="mt-1.5 text-sm text-ink">{featured.resultsTimeline}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Sessions</dt>
                  <dd className="mt-1.5 text-sm text-ink">{featured.recommendedSessions}</dd>
                </div>
              </dl>

              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href={`/services/${featured.slug}`} iconRight={<ArrowRight />}>
                  Read more
                </ButtonLink>
                <ButtonLink href="/book" variant="outline">
                  Book a consultation
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Before & after                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-line-subtle bg-canvas-sunken" aria-labelledby="results-heading">
        <div className="container-editorial section-y">
          <Reveal>
            <SectionHeading
              eyebrow="Results"
              title="Real outcomes, published with permission."
              description="Every image below is shared with the explicit written consent of the patient. Results vary from person to person."
              align="center"
              as="h2"
            />
          </Reveal>
          <h2 id="results-heading" className="sr-only">
            Before and after results
          </h2>

          <div className="mt-14">
            {cases.length ? (
              <>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {cases.slice(0, 3).map((item, i) => (
                    <Reveal key={item.id} delay={i * 100}>
                      <BeforeAfterSlider item={item} />
                    </Reveal>
                  ))}
                </div>
                <div className="mt-12 text-center">
                  <ButtonLink href="/results" variant="outline" iconRight={<ArrowRight />}>
                    View all results
                  </ButtonLink>
                </div>
              </>
            ) : (
              <BeforeAfterEmpty />
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* About                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="container-editorial section-y">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
          <Reveal className="order-2 lg:order-1 lg:col-span-6">
            <p className="eyebrow">The clinic</p>
            <h2 className="mt-5 font-display text-display-md">
              A quieter kind of aesthetic medicine.
            </h2>
            <div className="mt-6 space-y-5 text-[1.0625rem] leading-relaxed text-ink-muted">
              <p>
                The Skin Atelier was founded on a simple principle: aesthetic medicine belongs in
                clinical hands. Every plan here starts with a diagnosis, and every recommendation
                has to earn its place.
              </p>
              <p>
                That means we will sometimes tell you that the treatment you came in for is not the
                one you need — or that you do not need one at all. It is a slower way to build a
                practice, and the only one we are interested in.
              </p>
            </div>

            <div className="mt-10">
              <ButtonLink href="/about" variant="outline" iconRight={<ArrowRight />}>
                About the clinic
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={120} className="order-1 lg:order-2 lg:col-span-6">
            <div className="grid grid-cols-2 gap-4">
              <EditorialImage alt="Clinic interior" className="aspect-[3/4] w-full" sizes="25vw" tone={0} />
              <EditorialImage alt="Treatment room" className="mt-10 aspect-[3/4] w-full" sizes="25vw" tone={2} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Experts                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-line-subtle bg-canvas-sunken" aria-labelledby="experts-heading">
        <div className="container-editorial section-y">
          <Reveal className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              eyebrow="Our experts"
              title="The people who will treat you."
              description="You will meet the clinician who plans your treatment, and they will be the one who delivers it."
              as="h2"
            />
            <ButtonLink href="/doctors" variant="outline" iconRight={<ArrowRight />}>
              Meet the team
            </ButtonLink>
          </Reveal>
          <h2 id="experts-heading" className="sr-only">
            Our experts
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.slice(0, 3).map((doctor, i) => (
              <Reveal key={doctor.id} delay={i * 100}>
                <Link href={`/doctors/${doctor.slug}`} className="group block">
                  <EditorialImage
                    src={doctor.photoUrl}
                    alt={doctor.fullName}
                    className="aspect-[3/4] w-full"
                    imgClassName="transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    tone={i}
                  />
                  <h3 className="mt-6 font-display text-xl text-ink">{doctor.fullName}</h3>
                  <p className="eyebrow mt-2">{doctor.title}</p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    {doctor.specialties.join(" · ")}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Packages                                                          */}
      {/* ---------------------------------------------------------------- */}
      {featuredPackages.length > 0 && (
        <section className="container-editorial section-y" aria-labelledby="packages-heading">
          <Reveal>
            <SectionHeading
              eyebrow="Packages"
              title="Courses, priced as courses."
              description="Where a treatment is naturally delivered over several sessions, a package costs less than booking each one individually."
              align="center"
              as="h2"
            />
          </Reveal>
          <h2 id="packages-heading" className="sr-only">
            Treatment packages
          </h2>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {featuredPackages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 90}>
                <article className="flex h-full flex-col border border-line-subtle bg-canvas-raised p-8 transition-shadow duration-500 hover:shadow-lifted">
                  <h3 className="font-display text-2xl text-ink">{pkg.name}</h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-muted">
                    {pkg.description}
                  </p>

                  <ul className="mt-7 space-y-2 border-t border-line-subtle pt-6">
                    {pkg.items.map((item) => (
                      <li key={item.serviceId} className="flex justify-between gap-4 text-sm">
                        <span className="text-ink-muted">{item.serviceName}</span>
                        <span className="shrink-0 tabular-nums text-ink">×{item.sessions}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 flex items-baseline gap-3 border-t border-line-subtle pt-6">
                    <span className="font-display text-2xl text-ink">
                      {formatCurrency(pkg.price, settings.currencySymbol)}
                    </span>
                    {pkg.compareAtPrice && (
                      <span className="text-sm text-ink-subtle line-through">
                        {formatCurrency(pkg.compareAtPrice, settings.currencySymbol)}
                      </span>
                    )}
                  </div>

                  <ButtonLink href="/packages" variant="outline" fullWidth className="mt-6">
                    View details
                  </ButtonLink>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Testimonials                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-line-subtle bg-canvas-sunken" aria-labelledby="testimonials-heading">
        <div className="container-editorial section-y">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-4">
              <SectionHeading eyebrow="In their words" title="What our patients say." as="h2" />
              <h2 id="testimonials-heading" className="sr-only">
                Patient testimonials
              </h2>
              {settings.googleReviewUrl && (
                <a
                  href={settings.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-reveal mt-8 inline-block text-sm text-ink-muted"
                >
                  Read our Google reviews
                  <span className="link-reveal-line" />
                </a>
              )}
            </div>

            <div className="lg:col-span-8">
              <Testimonials items={testimonials} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Social rail                                                       */}
      {/* ---------------------------------------------------------------- */}
      {socialItems.length > 0 && (
        <section className="section-y-sm" aria-labelledby="social-heading">
          <div className="container-editorial">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="Follow" title="@theskinatelier" as="h2" />
              <h2 id="social-heading" className="sr-only">
                From our Instagram
              </h2>
              {settings.social.instagram && (
                <a
                  href={settings.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-reveal text-sm text-ink-muted"
                >
                  View on Instagram
                  <span className="link-reveal-line" />
                </a>
              )}
            </div>
          </div>

          {/* Full-bleed horizontal rail; only this element scrolls sideways. */}
          <ul className="rail-scroll mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--spacing-gutter)] pb-2">
            {socialItems.map((item, i) => (
              <li key={item.id} className="w-56 shrink-0 snap-start sm:w-64">
                <EditorialImage
                  src={item.imageUrl}
                  alt={item.altText}
                  className="aspect-square w-full"
                  sizes="16rem"
                  tone={i}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden bg-canvas-inverse text-ivory-100">
        <div className="absolute inset-0 -z-10 opacity-25">
          <EditorialImage alt="" className="size-full" sizes="100vw" tone={1} />
        </div>

        <div className="container-editorial section-y text-center">
          <Reveal>
            <p className="eyebrow text-ivory-100/55">Begin</p>
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-display-lg text-white">
              Your consultation is the first treatment.
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-[1.0625rem] leading-relaxed text-ivory-100/70">
              Tell us what you would like to change. We will tell you honestly what is possible,
              what it involves, and what it will cost — before you commit to anything.
            </p>

            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/book" size="lg" variant="accent" icon={<CalendarCheck />}>
                Book a consultation
              </ButtonLink>
              <ButtonLink
                href={whatsappLink(settings.whatsapp, `Hello ${settings.clinicName}, I would like to book a consultation.`)}
                size="lg"
                variant="outline"
                target="_blank"
                icon={<MessageCircle />}
                className="border-white/40 text-white hover:border-white hover:bg-white/10"
              >
                WhatsApp us
              </ButtonLink>
            </div>

            <p className="mt-8 text-sm text-ivory-100/55">
              <Phone className="mr-2 inline size-3.5" aria-hidden="true" />
              Prefer to call? <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="link-reveal text-ivory-100">
                {settings.phone}
                <span className="link-reveal-line" />
              </a>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
