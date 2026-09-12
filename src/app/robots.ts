import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/schema";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The admin and every API route are excluded from crawling. The admin
        // is also protected by auth and an X-Robots-Tag response header.
        disallow: ["/admin", "/admin/", "/api/", "/login"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
