import type { MetadataRoute } from "next";

/**
 * PWA manifest.
 *
 * `standalone` display is aimed at the front desk, who run the clinic system
 * on a tablet all day and benefit from an installed, chrome-free window.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Skin Atelier — Skin & Aesthetic Clinic",
    short_name: "Skin Atelier",
    description:
      "Advanced aesthetic and dermatological care in F-11 Markaz, Islamabad.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FBFAF7",
    theme_color: "#1C1917",
    categories: ["health", "medical", "beauty"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book a consultation", url: "/book" },
      { name: "Treatments", url: "/services" },
      { name: "Front desk", url: "/admin/clinic/front-desk" },
    ],
  };
}
