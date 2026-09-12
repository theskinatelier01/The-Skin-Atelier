import type { MetadataRoute } from "next";

import { getBlogPosts, getDoctors, getServices } from "@/lib/cms/queries";
import { absoluteUrl } from "@/lib/seo/schema";

/**
 * Sitemap.
 *
 * Built from the same CMS reads the pages use, so a service deactivated in the
 * admin disappears from the sitemap on the next revalidation. The admin area is
 * never listed and is additionally blocked in robots.txt.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, doctors, posts] = await Promise.all([
    getServices(),
    getDoctors(),
    getBlogPosts(500),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/services"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/book"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/results"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/packages"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/doctors"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/gallery"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...services.map((s) => ({
      url: absoluteUrl(`/services/${s.slug}`),
      lastModified: new Date(s.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    ...doctors.map((d) => ({
      url: absoluteUrl(`/doctors/${d.slug}`),
      lastModified: new Date(d.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
