import { notFound } from "next/navigation";
import { ExternalLink, LayoutTemplate } from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { SECTION_TYPES } from "@/types";

export const metadata = { title: "Pages" };
export const dynamic = "force-dynamic";

/**
 * Page builder overview.
 *
 * The public routes are code-backed so they stay fast and SEO-complete; what
 * the CMS controls is the section composition inside them. Each row below maps
 * to a route that reads its sections from the `pages` collection.
 */
const SYSTEM_PAGES = [
  { slug: "home", title: "Home", route: "/", sections: ["hero", "stats", "services", "concernFinder", "featuredTreatment", "beforeAfter", "doctors", "packages", "testimonials", "instagram", "cta"] },
  { slug: "about", title: "About", route: "/about", sections: ["hero", "text", "imageText", "doctors", "cta"] },
  { slug: "services", title: "Treatments", route: "/services", sections: ["hero", "services"] },
  { slug: "doctors", title: "Experts", route: "/doctors", sections: ["hero", "doctors"] },
  { slug: "results", title: "Results", route: "/results", sections: ["hero", "beforeAfter"] },
  { slug: "gallery", title: "Gallery", route: "/gallery", sections: ["hero", "gallery"] },
  { slug: "packages", title: "Packages", route: "/packages", sections: ["hero", "packages"] },
  { slug: "blog", title: "Skin Journal", route: "/blog", sections: ["hero", "blog"] },
  { slug: "faq", title: "FAQ", route: "/faq", sections: ["hero", "faq", "cta"] },
  { slug: "contact", title: "Contact", route: "/contact", sections: ["hero", "text", "cta"] },
  { slug: "book", title: "Book", route: "/book", sections: ["hero", "text"] },
];

export default async function AdminPagesPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.pages.read")) notFound();

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Pages"
        description="Every public page and the sections it is built from. Content for each section is managed in its own area."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Pages" }]}
      />

      <AdminSection title="Public pages" description={`${SYSTEM_PAGES.length} routes`}>
        <ul className="divide-y divide-line-subtle">
          {SYSTEM_PAGES.map((page) => (
            <li key={page.slug} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ink">{page.title}</p>
                  <Badge tone="success" dot>
                    Published
                  </Badge>
                </div>
                <p className="mt-0.5 font-mono text-xs text-ink-subtle">{page.route}</p>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {page.sections.map((section) => (
                    <li
                      key={section}
                      className="rounded-xs border border-line px-2 py-0.5 text-[0.625rem] text-ink-muted"
                    >
                      {section}
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={page.route}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${page.title} on the website`}
                className="grid size-9 shrink-0 place-items-center rounded-sm border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </AdminSection>

      <div className="mt-5">
        <AdminSection
          title="Available section types"
          description="Blocks that can be composed into a page"
        >
          <div className="flex flex-wrap gap-2 p-5">
            {SECTION_TYPES.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 rounded-sm border border-line-subtle bg-canvas px-2.5 py-1.5 text-xs text-ink-muted"
              >
                <LayoutTemplate className="size-3" aria-hidden="true" />
                {type}
              </span>
            ))}
          </div>
        </AdminSection>
      </div>
    </>
  );
}
