import Link from "next/link";
import { Clock, Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";

import type { ClinicSettings, Menu } from "@/types";
import { whatsappLink } from "@/lib/utils/format";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Collapses consecutive days with identical hours into a single line. */
function groupHours(hours: ClinicSettings["openingHours"]) {
  const ordered = [...hours].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));
  const groups: { label: string; value: string }[] = [];

  for (const h of ordered) {
    const value = h.closed ? "Closed" : `${h.open} – ${h.close}`;
    const last = groups.at(-1);
    const dayName = DAYS[h.day];
    if (last && last.value === value) {
      last.label = `${last.label.split("–")[0].trim()} – ${dayName}`;
    } else {
      groups.push({ label: dayName, value });
    }
  }
  return groups;
}

export function SiteFooter({
  settings,
  serviceMenu,
  clinicMenu,
  legalMenu,
}: {
  settings: ClinicSettings;
  serviceMenu?: Menu | null;
  clinicMenu?: Menu | null;
  legalMenu?: Menu | null;
}) {
  const hours = groupHours(settings.openingHours);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-canvas-inverse text-ivory-100">
      <div className="container-editorial section-y-sm">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Identity */}
          <div className="lg:col-span-4">
            <p className="font-display text-2xl">{settings.clinicName}</p>
            <p className="mt-1 text-[0.625rem] uppercase tracking-[0.32em] text-ivory-100/50">
              {settings.tagline}
            </p>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory-100/65">
              Consultation-led dermatology and aesthetic medicine in the heart of Islamabad.
            </p>

            <div className="mt-7 flex gap-3">
              {settings.social.instagram && (
                <SocialLink href={settings.social.instagram} label="Instagram">
                  <Instagram className="size-4" aria-hidden="true" />
                </SocialLink>
              )}
              {settings.social.facebook && (
                <SocialLink href={settings.social.facebook} label="Facebook">
                  <Facebook className="size-4" aria-hidden="true" />
                </SocialLink>
              )}
            </div>
          </div>

          {/* Treatments */}
          <FooterColumn title="Treatments" className="lg:col-span-2">
            {serviceMenu?.items.map((i) => (
              <FooterLink key={i.id} href={i.url}>
                {i.label}
              </FooterLink>
            ))}
          </FooterColumn>

          {/* Clinic */}
          <FooterColumn title="Clinic" className="lg:col-span-2">
            {clinicMenu?.items.map((i) => (
              <FooterLink key={i.id} href={i.url}>
                {i.label}
              </FooterLink>
            ))}
          </FooterColumn>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h2 className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-ivory-100/45">
              Visit Us
            </h2>
            <address className="mt-5 space-y-3.5 text-sm not-italic text-ivory-100/75">
              <ContactRow icon={<MapPin className="size-4" aria-hidden="true" />}>
                <a
                  href={settings.googleMapsUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-reveal"
                >
                  {settings.addressLine}, {settings.city}
                  <span className="link-reveal-line" />
                </a>
              </ContactRow>
              <ContactRow icon={<Phone className="size-4" aria-hidden="true" />}>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="link-reveal">
                  {settings.phone}
                  <span className="link-reveal-line" />
                </a>
              </ContactRow>
              <ContactRow icon={<Mail className="size-4" aria-hidden="true" />}>
                <a href={`mailto:${settings.email}`} className="link-reveal">
                  {settings.email}
                  <span className="link-reveal-line" />
                </a>
              </ContactRow>
              <ContactRow icon={<Clock className="size-4" aria-hidden="true" />}>
                <ul className="space-y-1">
                  {hours.map((h) => (
                    <li key={h.label} className="flex justify-between gap-6">
                      <span>{h.label}</span>
                      <span className="tabular-nums text-ivory-100/60">{h.value}</span>
                    </li>
                  ))}
                </ul>
              </ContactRow>
            </address>

            <a
              href={whatsappLink(settings.whatsapp, `Hello ${settings.clinicName}, I would like to enquire about a treatment.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-sm border border-ivory-100/25 px-5 text-sm transition-colors hover:border-ivory-100/60 hover:bg-ivory-100/5"
            >
              Message us on WhatsApp
            </a>
          </div>
        </div>

        {/* Medical disclaimer — required context for any aesthetic clinic site. */}
        <p className="mt-16 max-w-3xl border-t border-ivory-100/10 pt-8 text-xs leading-relaxed text-ivory-100/40">
          The information on this website is provided for general guidance and does not constitute
          medical advice. Treatment suitability is determined by a qualified clinician during
          consultation, and results vary from person to person. Before and after images are
          published only with the explicit written consent of the patient concerned.
        </p>

        <div className="mt-8 flex flex-col gap-4 border-t border-ivory-100/10 pt-8 text-xs text-ivory-100/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.clinicName}. All rights reserved.
          </p>
          <nav aria-label="Legal">
            <ul className="flex gap-6">
              {legalMenu?.items.map((i) => (
                <li key={i.id}>
                  <Link href={i.url} className="link-reveal transition-colors hover:text-ivory-100/80">
                    {i.label}
                    <span className="link-reveal-line" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-[0.625rem] font-medium uppercase tracking-[0.2em] text-ivory-100/45">
        {title}
      </h2>
      <ul className="mt-5 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="link-reveal text-sm text-ivory-100/70 transition-colors hover:text-ivory-100">
        {children}
        <span className="link-reveal-line" />
      </Link>
    </li>
  );
}

function ContactRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-champagne-400">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid size-11 place-items-center rounded-sm border border-ivory-100/20 text-ivory-100/70 transition-colors hover:border-ivory-100/50 hover:text-ivory-100"
    >
      {children}
    </a>
  );
}
