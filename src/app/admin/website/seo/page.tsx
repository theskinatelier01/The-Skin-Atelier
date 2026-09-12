import { notFound } from "next/navigation";
import { Globe, Search } from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getBlogPosts, getDoctors, getServices, getSettings } from "@/lib/cms/queries";

export const metadata = { title: "SEO" };
export const dynamic = "force-dynamic";

/**
 * SEO overview.
 *
 * Rather than a settings form nobody revisits, this screen audits what is
 * actually published: which pages are missing a title or description, and what
 * structured data the site is emitting.
 */
export default async function SeoPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.seo.write")) notFound();

  const [settings, services, doctors, posts] = await Promise.all([
    getSettings(),
    getServices(),
    getDoctors(),
    getBlogPosts(200),
  ]);

  const missingTitle = services.filter((s) => !s.seo?.title);
  const missingDescription = services.filter((s) => !s.seo?.description);
  const indexable = services.length + doctors.length + posts.length + 13;

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="SEO"
        description="What search engines currently see. Sitemap and robots.txt are generated from live content on every revalidation."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "SEO" }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Indexable pages" value={indexable} icon={<Globe />} />
        <StatCard
          label="Missing SEO title"
          value={missingTitle.length}
          tone={missingTitle.length > 0 ? "warning" : "positive"}
        />
        <StatCard
          label="Missing description"
          value={missingDescription.length}
          tone={missingDescription.length > 0 ? "warning" : "positive"}
        />
        <StatCard label="Target keywords" value={settings.seoDefaults?.keywords?.length ?? 0} icon={<Search />} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <AdminSection title="Structured data emitted" description="schema.org markup on the live site">
          <ul className="divide-y divide-line-subtle text-sm">
            {[
              { type: "MedicalClinic + HealthAndBeautyBusiness", where: "Every page (site layout)" },
              { type: "MedicalProcedure", where: "Each treatment page" },
              { type: "Physician", where: "Each clinician profile" },
              { type: "FAQPage", where: "FAQ page and treatments with questions" },
              { type: "Article", where: "Each journal article" },
              { type: "BreadcrumbList", where: "All inner pages" },
              { type: "AggregateRating", where: "Only when a real rating is recorded in settings" },
            ].map((row) => (
              <li key={row.type} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3">
                <code className="font-mono text-xs text-ink">{row.type}</code>
                <span className="text-xs text-ink-subtle">{row.where}</span>
              </li>
            ))}
          </ul>
        </AdminSection>

        <AdminSection title="Target keywords" description="From the SEO defaults in settings">
          <div className="flex flex-wrap gap-2 p-5">
            {(settings.seoDefaults?.keywords ?? []).map((keyword) => (
              <Badge key={keyword} tone="neutral">
                {keyword}
              </Badge>
            ))}
          </div>
          <p className="border-t border-line-subtle px-5 py-4 text-xs leading-relaxed text-ink-muted">
            Avoid superlative claims such as best clinic in page titles unless they can be
            substantiated. Search engines increasingly discount them, and in a medical context an
            unsupported claim carries regulatory risk as well.
          </p>
        </AdminSection>
      </div>

      {missingTitle.length > 0 && (
        <div className="mt-5">
          <AdminSection
            title="Treatments missing an SEO title"
            description="These fall back to the treatment name, which is usually weaker"
          >
            <ul className="divide-y divide-line-subtle">
              {missingTitle.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="text-sm text-ink">{service.name}</span>
                  <a
                    href={`/admin/website/services/${service.id}`}
                    className="text-xs text-ink-muted transition-colors hover:text-ink"
                  >
                    Add one
                  </a>
                </li>
              ))}
            </ul>
          </AdminSection>
        </div>
      )}
    </>
  );
}
