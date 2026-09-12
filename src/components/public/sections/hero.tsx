import { ArrowRight, MapPin, Phone, Star } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { EditorialImage } from "@/components/public/editorial-image";
import type { ClinicSettings } from "@/types";

/**
 * Homepage hero.
 *
 * Full-viewport editorial image with a charcoal scrim. The scrim is not
 * decorative — it guarantees the 4.5:1 contrast for the headline regardless of
 * which photograph the clinic uploads through the CMS.
 */
export function Hero({
  settings,
  heading,
  subheading,
  imageUrl,
}: {
  settings: ClinicSettings;
  heading: string;
  subheading: string;
  imageUrl?: string;
}) {
  const todayHours = settings.openingHours.find((h) => h.day === new Date().getDay());

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <EditorialImage
          src={imageUrl}
          alt="The Skin Atelier clinic interior"
          className="size-full"
          sizes="100vw"
          priority
          kenBurns
          tone={1}
        />
        {/* Two-stop scrim: heavier at the base where the type sits. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/45 to-charcoal-950/30"
        />
      </div>

      <div className="container-editorial pb-16 pt-40 sm:pb-20 lg:pb-24">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-[0.625rem] font-medium uppercase tracking-[0.28em] text-ivory-100/75">
            <span className="h-px w-8 bg-champagne-400" aria-hidden="true" />
            Skin &amp; Aesthetic Clinic · {settings.city}
          </p>

          <h1 className="mt-7 font-display text-display-xl text-white">{heading}</h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-ivory-100/80 sm:text-[1.0625rem]">
            {subheading}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/book" size="lg" iconRight={<ArrowRight />}>
              Book Consultation
            </ButtonLink>
            <ButtonLink
              href="/services"
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:border-white hover:bg-white/10"
            >
              Explore Treatments
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Clinic facts strip */}
      <div className="border-t border-white/15 bg-charcoal-950/35 backdrop-blur-sm">
        <div className="container-editorial">
          <dl className="grid grid-cols-2 divide-white/10 py-5 text-ivory-100/80 sm:py-6 lg:grid-cols-4 lg:divide-x">
            <HeroFact
              icon={<Star className="size-3.5 fill-champagne-400 text-champagne-400" />}
              label="Google Rating"
            >
              {settings.googleRating?.toFixed(1)} / 5
              <span className="ml-1.5 text-ivory-100/45">
                ({settings.googleReviewCount} reviews)
              </span>
            </HeroFact>

            <HeroFact icon={<MapPin className="size-3.5 text-champagne-400" />} label="Location">
              F-11 Markaz, {settings.city}
            </HeroFact>

            <HeroFact icon={<Phone className="size-3.5 text-champagne-400" />} label="Call the clinic">
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="link-reveal">
                {settings.phone}
                <span className="link-reveal-line" />
              </a>
            </HeroFact>

            <HeroFact label="Open Today" icon={<span aria-hidden="true" className="size-1.5 rounded-full bg-champagne-400" />}>
              {todayHours && !todayHours.closed ? `${todayHours.open} – ${todayHours.close}` : "Closed today"}
            </HeroFact>
          </dl>
        </div>
      </div>
    </section>
  );
}

function HeroFact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-0 py-3 lg:px-6 lg:py-1 lg:first:pl-0">
      <dt className="flex items-center gap-2 text-[0.5625rem] uppercase tracking-[0.2em] text-ivory-100/50">
        <span aria-hidden="true" className="flex items-center">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1.5 text-[0.8125rem] text-ivory-100/90">{children}</dd>
    </div>
  );
}
