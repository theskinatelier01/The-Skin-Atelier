import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { PageHero } from "@/components/public/page-hero";
import { ContactForm } from "@/components/public/contact-form";
import { getSettings } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/schema";
import { whatsappLink } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Contact & Directions",
  description:
    "Contact The Skin Atelier in F-11 Markaz, Islamabad. Call 0337 5977799, message us on WhatsApp, or send an enquiry through the form.",
  alternates: { canonical: "/contact" },
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ContactPage() {
  const settings = await getSettings();
  const todayIndex = new Date().getDay();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Contact", url: "/contact" },
        ])}
      />

      <PageHero
        eyebrow="Contact"
        title="Get in touch."
        description="Call us, message us on WhatsApp, or send an enquiry below. For appointment requests, the booking form will reach the front desk faster."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <div className="container-editorial section-y">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          {/* Details */}
          <div className="lg:col-span-5">
            <h2 className="font-display text-display-sm">The clinic</h2>

            <dl className="mt-9 space-y-7">
              <DetailBlock icon={<MapPin className="size-4" />} label="Address">
                <p>{settings.addressLine}</p>
                <p>
                  {settings.city}, {settings.country}
                </p>
                {settings.googleMapsUrl && (
                  <a
                    href={settings.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-reveal mt-2 inline-block text-ink-muted"
                  >
                    Open in Google Maps
                    <span className="link-reveal-line" />
                  </a>
                )}
              </DetailBlock>

              <DetailBlock icon={<Phone className="size-4" />} label="Telephone">
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="link-reveal">
                  {settings.phone}
                  <span className="link-reveal-line" />
                </a>
              </DetailBlock>

              <DetailBlock icon={<MessageCircle className="size-4" />} label="WhatsApp">
                <a
                  href={whatsappLink(
                    settings.whatsapp,
                    `Hello ${settings.clinicName}, I have a question.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-reveal"
                >
                  Start a conversation
                  <span className="link-reveal-line" />
                </a>
              </DetailBlock>

              <DetailBlock icon={<Mail className="size-4" />} label="Email">
                <a href={`mailto:${settings.email}`} className="link-reveal">
                  {settings.email}
                  <span className="link-reveal-line" />
                </a>
              </DetailBlock>

              <DetailBlock icon={<Clock className="size-4" />} label="Opening hours">
                <ul className="space-y-1.5">
                  {[...settings.openingHours]
                    .sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7))
                    .map((h) => (
                      <li
                        key={h.day}
                        className={`flex justify-between gap-8 ${
                          h.day === todayIndex ? "text-ink" : "text-ink-muted"
                        }`}
                      >
                        <span>
                          {DAYS[h.day]}
                          {h.day === todayIndex && (
                            <span className="ml-2 text-[0.625rem] uppercase tracking-[0.14em] text-champagne-500">
                              Today
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums">
                          {h.closed ? "Closed" : `${h.open} – ${h.close}`}
                        </span>
                      </li>
                    ))}
                </ul>
              </DetailBlock>
            </dl>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="border border-line-subtle bg-canvas-raised p-8 sm:p-10">
              <h2 className="font-display text-display-sm">Send us a message</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                We reply to enquiries within one working day. For anything urgent, please call.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      {settings.googleMapsEmbedUrl ? (
        <section aria-label="Clinic location map" className="border-t border-line-subtle">
          <iframe
            src={settings.googleMapsEmbedUrl}
            title={`Map showing ${settings.clinicName} in ${settings.city}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[26rem] w-full border-0 grayscale-[0.35]"
          />
        </section>
      ) : (
        <section className="border-t border-line-subtle bg-canvas-sunken">
          <div className="container-editorial flex flex-col items-center py-20 text-center">
            <MapPin aria-hidden="true" className="size-5 text-champagne-500" />
            <p className="mt-4 font-display text-xl">{settings.addressLine}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {settings.city}, {settings.country}
            </p>
            {settings.googleMapsUrl && (
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-reveal mt-5 text-sm text-ink"
              >
                Get directions
                <span className="link-reveal-line" />
              </a>
            )}
          </div>
        </section>
      )}
    </>
  );
}

function DetailBlock({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span aria-hidden="true" className="mt-1 shrink-0 text-champagne-500">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="eyebrow">{label}</dt>
        <dd className="mt-2 text-sm leading-relaxed text-ink">{children}</dd>
      </div>
    </div>
  );
}
