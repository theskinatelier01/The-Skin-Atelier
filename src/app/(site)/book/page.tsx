import type { Metadata } from "next";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";

import { PageHero } from "@/components/public/page-hero";
import { BookingForm } from "@/components/public/booking-form";
import { getDoctors, getServices, getSettings } from "@/lib/cms/queries";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/schema";
import { whatsappLink } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description:
    "Request a consultation at The Skin Atelier, F-11 Markaz Islamabad. Tell us what you would like to change and our front desk will confirm a time.",
  alternates: { canonical: "/book" },
};

export default async function BookPage() {
  const [settings, services, doctors] = await Promise.all([
    getSettings(),
    getServices(),
    getDoctors(),
  ]);

  const today = settings.openingHours.find((h) => h.day === new Date().getDay());

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Book", url: "/book" },
        ])}
      />

      <PageHero
        eyebrow="Book"
        title="Request a consultation."
        description="Every treatment begins with an assessment. Tell us what you would like to change and we will arrange a time to talk it through properly."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Book" }]}
      />

      <div className="container-editorial section-y">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-7">
            <BookingForm
              services={services}
              doctors={doctors}
              enabled={settings.onlineBookingEnabled}
            />
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="border border-line-subtle bg-canvas-raised p-8">
                <h2 className="font-display text-xl">Prefer to speak to someone?</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Our front desk can usually find you a time straight away, and can answer
                  questions about preparation or cost before you commit.
                </p>

                <div className="mt-7 space-y-4">
                  <ContactLine icon={<Phone className="size-4" />} label="Call the clinic">
                    <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="link-reveal">
                      {settings.phone}
                      <span className="link-reveal-line" />
                    </a>
                  </ContactLine>

                  <ContactLine icon={<MessageCircle className="size-4" />} label="WhatsApp">
                    <a
                      href={whatsappLink(
                        settings.whatsapp,
                        `Hello ${settings.clinicName}, I would like to book a consultation.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-reveal"
                    >
                      Message us
                      <span className="link-reveal-line" />
                    </a>
                  </ContactLine>

                  <ContactLine icon={<Clock className="size-4" />} label="Open today">
                    {today && !today.closed ? `${today.open} – ${today.close}` : "Closed today"}
                  </ContactLine>

                  <ContactLine icon={<MapPin className="size-4" />} label="Find us">
                    {settings.addressLine}, {settings.city}
                  </ContactLine>
                </div>
              </div>

              <div className="mt-8 border border-line-subtle p-8">
                <h2 className="font-display text-lg">What happens next</h2>
                <ol className="mt-5 space-y-5">
                  {[
                    {
                      title: "We call you back",
                      body: "Usually within one working day, to confirm a time and clinician.",
                    },
                    {
                      title: "Your consultation",
                      body: "A full assessment, a written plan, and a clear cost before you commit to anything.",
                    },
                    {
                      title: "Treatment, if appropriate",
                      body: "Sometimes on the same day; often after preparation. Sometimes we advise against it entirely.",
                    },
                  ].map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                      <span
                        aria-hidden="true"
                        className="font-display text-lg leading-none text-champagne-400"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="mt-8 text-xs leading-relaxed text-ink-subtle">
                Your details are stored securely and used only to arrange and deliver your care.
                They are never sold or shared for marketing. You can ask us to delete them at any
                time.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function ContactLine({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3.5">
      <span aria-hidden="true" className="mt-0.5 shrink-0 text-champagne-500">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <p className="mt-1 text-sm text-ink">{children}</p>
      </div>
    </div>
  );
}
