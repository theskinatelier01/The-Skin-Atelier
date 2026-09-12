import { notFound } from "next/navigation";
import { Quote, Star } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getTestimonials } from "@/lib/cms/queries";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.testimonials.write")) notFound();

  const testimonials = await getTestimonials();
  const average =
    testimonials.length > 0
      ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
      : 0;

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Testimonials"
        description="Reviews shown on the homepage carousel. Publish only what the patient has agreed to have quoted."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Testimonials" }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={testimonials.length} icon={<Quote />} />
        <StatCard
          label="Visible"
          value={testimonials.filter((t) => t.isVisible).length}
          tone="positive"
        />
        <StatCard label="Average rating" value={average.toFixed(1)} icon={<Star />} />
      </div>

      <div className="mt-5">
        <AdminSection title="All testimonials" description={`${testimonials.length} recorded`}>
          {testimonials.length === 0 ? (
            <EmptyState
              icon={<Quote />}
              title="No testimonials yet"
              description="Add reviews collected from Google, Instagram or in the clinic."
            />
          ) : (
            <ul className="divide-y divide-line-subtle">
              {testimonials.map((t) => (
                <li key={t.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{t.authorName}</p>
                    <span className="flex" aria-label={`Rated ${t.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          aria-hidden="true"
                          className={
                            i < t.rating
                              ? "size-3 fill-champagne-400 text-champagne-400"
                              : "size-3 text-line"
                          }
                        />
                      ))}
                    </span>
                    <Badge tone="neutral">{t.source}</Badge>
                    <Badge tone={t.isVisible ? "success" : "neutral"} dot>
                      {t.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </div>

                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">{t.body}</p>

                  <p className="mt-2 text-xs text-ink-subtle">
                    {t.serviceName ?? "General"}
                    {t.date ? ` · ${formatDate(t.date)}` : ""}
                    {` · display order ${t.displayOrder}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>
      </div>
    </>
  );
}
