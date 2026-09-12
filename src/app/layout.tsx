import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import "./globals.css";

/**
 * Fonts are self-hosted by next/font, which removes the render-blocking
 * request to fonts.googleapis.com and eliminates layout shift by generating a
 * matched fallback metric. `display: swap` keeps text visible while loading.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "The Skin Atelier — Skin & Aesthetic Clinic, Islamabad",
    template: "%s | The Skin Atelier",
  },
  description:
    "Advanced aesthetic and dermatological care in F-11 Markaz, Islamabad. Consultation-led treatments for skin, hair and confidence.",
  applicationName: "The Skin Atelier",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: true, address: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom is never disabled — pinch-to-zoom is an accessibility requirement.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#1C1917" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
