import type { BlogPost, ClinicSettings, Doctor, Faq, Service } from "@/types";

/**
 * Structured data (schema.org).
 *
 * Claims here mirror what the site actually says. Aggregate ratings are only
 * emitted when the clinic has recorded a real rating and review count in
 * settings — inventing them would be a policy violation as well as dishonest.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function localBusinessSchema(settings: ClinicSettings) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    // MedicalClinic is the most specific accurate type for a dermatology and
    // aesthetics practice, and it inherits from LocalBusiness.
    "@type": ["MedicalClinic", "HealthAndBeautyBusiness"],
    "@id": absoluteUrl("/#clinic"),
    name: settings.clinicName,
    description: settings.seoDefaults?.description,
    url: absoluteUrl("/"),
    telephone: settings.phone,
    email: settings.email,
    image: settings.logoUrl ? absoluteUrl(settings.logoUrl) : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressLine,
      addressLocality: settings.city,
      addressCountry: settings.country === "Pakistan" ? "PK" : settings.country,
    },
    medicalSpecialty: "Dermatology",
    priceRange: "$$$",
    currenciesAccepted: settings.currency,
    paymentAccepted: "Cash, Credit Card, Bank Transfer, Easypaisa, JazzCash",
    hasMap: settings.googleMapsUrl,
    sameAs: Object.values(settings.social ?? {}).filter(Boolean),
    openingHoursSpecification: settings.openingHours
      .filter((h) => !h.closed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${DAY_NAMES[h.day]}`,
        opens: h.open,
        closes: h.close,
      })),
  };

  // Only emitted when a genuine rating exists on the settings document.
  if (settings.googleRating && settings.googleReviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: settings.googleRating,
      reviewCount: settings.googleReviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function serviceSchema(service: Service, settings: ClinicSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: service.name,
    description: service.shortDescription,
    url: absoluteUrl(`/services/${service.slug}`),
    procedureType: "https://schema.org/NoninvasiveProcedure",
    bodyLocation: service.categoryName,
    howPerformed: service.treatmentProcess.map((s) => s.description).join(" "),
    preparation: "Assessed during an in-person consultation with a qualified clinician.",
    followup: service.resultsTimeline,
    provider: {
      "@type": "MedicalClinic",
      "@id": absoluteUrl("/#clinic"),
      name: settings.clinicName,
    },
    ...(service.price && !service.priceOnConsultation
      ? {
          offers: {
            "@type": "Offer",
            price: service.price,
            priceCurrency: settings.currency,
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/services/${service.slug}`),
          },
        }
      : {}),
  };
}

export function faqSchema(faqs: Pick<Faq, "question" | "answer">[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function physicianSchema(doctor: Doctor, settings: ClinicSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.fullName,
    url: absoluteUrl(`/doctors/${doctor.slug}`),
    jobTitle: doctor.title,
    description: doctor.bio.split("\n")[0],
    image: doctor.photoUrl,
    medicalSpecialty: doctor.specialties,
    knowsLanguage: doctor.languages,
    worksFor: {
      "@type": "MedicalClinic",
      "@id": absoluteUrl("/#clinic"),
      name: settings.clinicName,
    },
  };
}

export function articleSchema(post: BlogPost, settings: ClinicSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.authorName },
    publisher: {
      "@type": "Organization",
      name: settings.clinicName,
      logo: settings.logoUrl ? { "@type": "ImageObject", url: absoluteUrl(settings.logoUrl) } : undefined,
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };
}

export function breadcrumbSchema(trail: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absoluteUrl(t.url),
    })),
  };
}

/** Renders a JSON-LD block. Returns null for empty schemas so callers can inline it. */
export function JsonLd({ data }: { data: unknown }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
