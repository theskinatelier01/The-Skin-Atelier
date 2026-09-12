import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/public/page-hero";
import { Accordion } from "@/components/public/accordion";
import { getFaqs } from "@/lib/cms/queries";
import { breadcrumbSchema, faqSchema, JsonLd } from "@/lib/seo/schema";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about consultations, treatments, pricing, downtime and privacy at The Skin Atelier, Islamabad.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = (await getFaqs()).filter((f) => f.showOnFaqPage);

  const byCategory = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    (acc[faq.category] ??= []).push(faq);
    return acc;
  }, {});

  return (
    <>
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "FAQ", url: "/faq" },
        ])}
      />

      <PageHero
        eyebrow="FAQ"
        title="Questions, answered plainly."
        description="If your question is not here, call the clinic and ask. We would rather answer it before you book than after."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />

      <div className="container-editorial section-y">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <nav aria-label="FAQ categories" className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow">Categories</p>
              <ul className="mt-5 space-y-2.5">
                {Object.keys(byCategory).map((category) => (
                  <li key={category}>
                    <a
                      href={`#${category.toLowerCase().replace(/\s+/g, "-")}`}
                      className="link-reveal text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {category}
                      <span className="link-reveal-line" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="lg:col-span-9">
            <div className="space-y-16">
              {Object.entries(byCategory).map(([category, items]) => (
                <section
                  key={category}
                  id={category.toLowerCase().replace(/\s+/g, "-")}
                  className="scroll-mt-32"
                >
                  <h2 className="font-display text-display-sm">{category}</h2>
                  <div className="mt-7">
                    <Accordion
                      items={items.map((f) => ({
                        id: f.id,
                        question: f.question,
                        answer: f.answer,
                      }))}
                    />
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-16 border border-line-subtle bg-canvas-sunken p-8 sm:p-10">
              <h2 className="font-display text-xl">Still have a question?</h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-muted">
                Our front desk can answer most questions on the phone, including whether a
                treatment is likely to suit you before you commit to a consultation.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink href="/contact">Contact the clinic</ButtonLink>
                <ButtonLink href="/book" variant="outline">
                  Book a consultation
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
