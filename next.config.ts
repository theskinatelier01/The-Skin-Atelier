import type { NextConfig } from "next";

/**
 * On Firebase App Hosting the web app config arrives at build time as
 * FIREBASE_WEBAPP_CONFIG. Map it onto the NEXT_PUBLIC_FIREBASE_* names the app
 * reads, unless they are already set (e.g. from .env.local).
 */
function firebaseWebAppEnv(): Record<string, string> {
  const raw = process.env.FIREBASE_WEBAPP_CONFIG;
  if (!raw) return {};
  let config: Record<string, string | undefined>;
  try {
    config = JSON.parse(raw);
  } catch {
    return {};
  }
  const mapped: Record<string, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: config.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: config.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: config.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: config.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: config.appId,
  };
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(mapped)) {
    if (value && !process.env[key]) env[key] = value;
  }
  return env;
}

const nextConfig: NextConfig = {
  env: firebaseWebAppEnv(),
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920, 2560],
  },
  experimental: { optimizePackageImports: ["lucide-react", "date-fns", "recharts"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
