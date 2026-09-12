import "server-only";

import { cache } from "react";

import { adminDb, readOrFallback } from "@/lib/firebase/admin";
import { C, SETTINGS_DOC_ID } from "@/lib/firebase/collections";
import { fromSnapshot } from "@/lib/firebase/convert";
import type {
  BeforeAfterCase,
  BlogPost,
  ClinicSettings,
  Doctor,
  Faq,
  GalleryItem,
  Menu,
  Package,
  Page,
  Service,
  ServiceCategory,
  Testimonial,
} from "@/types";
import {
  DEFAULT_DOCTORS,
  DEFAULT_FAQS,
  DEFAULT_GALLERY,
  DEFAULT_MENUS,
  DEFAULT_PACKAGES,
  DEFAULT_SERVICES,
  DEFAULT_SERVICE_CATEGORIES,
  DEFAULT_SETTINGS,
  DEFAULT_TESTIMONIALS,
} from "./defaults";

/**
 * Public-site reads.
 *
 * Each function is wrapped in `cache()` so a page that needs settings in the
 * header, the footer and a schema block pays for one Firestore read, not three.
 * Every function falls back to bundled defaults when Firebase is unconfigured.
 */

export const getSettings = cache(async (): Promise<ClinicSettings> =>
  readOrFallback(async () => {
    const snap = await adminDb().collection(C.settings).doc(SETTINGS_DOC_ID).get();
    if (!snap.exists) return DEFAULT_SETTINGS;
    return { id: snap.id, ...snap.data() } as ClinicSettings;
  }, DEFAULT_SETTINGS),
);

export const getServices = cache(async (): Promise<Service[]> =>
  readOrFallback(async () => {
    const snap = await adminDb()
      .collection(C.services)
      .where("isActive", "==", true)
      .orderBy("displayOrder")
      .get();
    const items = snap.docs.map((d) => fromSnapshot<Service>(d)).filter((s) => !s.deletedAt);
    return items.length ? items : DEFAULT_SERVICES;
  }, DEFAULT_SERVICES),
);

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  const services = await getServices();
  return services.find((s) => s.slug === slug) ?? null;
});

export const getServiceCategories = cache(async (): Promise<ServiceCategory[]> =>
  readOrFallback(async () => {
    const snap = await adminDb()
      .collection(C.serviceCategories)
      .where("isActive", "==", true)
      .orderBy("displayOrder")
      .get();
    const items = snap.docs.map((d) => fromSnapshot<ServiceCategory>(d));
    return items.length ? items : DEFAULT_SERVICE_CATEGORIES;
  }, DEFAULT_SERVICE_CATEGORIES),
);

export const getDoctors = cache(async (): Promise<Doctor[]> =>
  readOrFallback(async () => {
    const snap = await adminDb()
      .collection(C.doctors)
      .where("isPublished", "==", true)
      .orderBy("displayOrder")
      .get();
    const items = snap.docs.map((d) => fromSnapshot<Doctor>(d)).filter((d) => !d.deletedAt);
    return items.length ? items : DEFAULT_DOCTORS;
  }, DEFAULT_DOCTORS),
);

export const getDoctorBySlug = cache(async (slug: string): Promise<Doctor | null> => {
  const doctors = await getDoctors();
  return doctors.find((d) => d.slug === slug) ?? null;
});

export const getPackages = cache(async (): Promise<Package[]> =>
  readOrFallback(async () => {
    const snap = await adminDb()
      .collection(C.packages)
      .where("isActive", "==", true)
      .orderBy("displayOrder")
      .get();
    const items = snap.docs.map((d) => fromSnapshot<Package>(d)).filter((p) => !p.deletedAt);
    return items.length ? items : DEFAULT_PACKAGES;
  }, DEFAULT_PACKAGES),
);

export const getTestimonials = cache(async (): Promise<Testimonial[]> =>
  readOrFallback(async () => {
    const snap = await adminDb()
      .collection(C.testimonials)
      .where("isVisible", "==", true)
      .orderBy("displayOrder")
      .get();
    const items = snap.docs.map((d) => fromSnapshot<Testimonial>(d));
    return items.length ? items : DEFAULT_TESTIMONIALS;
  }, DEFAULT_TESTIMONIALS),
);

export const getFaqs = cache(async (): Promise<Faq[]> =>
  readOrFallback(async () => {
    const snap = await adminDb()
      .collection(C.faqs)
      .where("isVisible", "==", true)
      .orderBy("displayOrder")
      .get();
    const items = snap.docs.map((d) => fromSnapshot<Faq>(d));
    return items.length ? items : DEFAULT_FAQS;
  }, DEFAULT_FAQS),
);

export const getMenus = cache(async (): Promise<Record<string, Menu>> =>
  readOrFallback(async () => {
    const snap = await adminDb().collection(C.menus).get();
    const items = snap.docs.map((d) => fromSnapshot<Menu>(d));
    const source = items.length ? items : DEFAULT_MENUS;
    return Object.fromEntries(source.map((m) => [m.key, m]));
  }, Object.fromEntries(DEFAULT_MENUS.map((m) => [m.key, m]))),
);

export const getMenu = cache(async (key: string): Promise<Menu | null> => {
  const menus = await getMenus();
  return menus[key] ?? null;
});

export const getGallery = cache(async (): Promise<GalleryItem[]> =>
  readOrFallback(async () => {
    const snap = await adminDb()
      .collection(C.gallery)
      .where("isVisible", "==", true)
      .orderBy("displayOrder")
      .get();
    const items = snap.docs.map((d) => fromSnapshot<GalleryItem>(d));
    return items.length ? items : DEFAULT_GALLERY;
  }, DEFAULT_GALLERY),
);

/**
 * Published before/after cases only.
 *
 * The consent check is repeated here even though the Firestore rules enforce
 * it, so that a mistake in one layer cannot expose patient imagery on its own.
 */
export const getPublishedBeforeAfter = cache(async (): Promise<BeforeAfterCase[]> =>
  readOrFallback(async () => {
    const snap = await adminDb()
      .collection(C.beforeAfterCases)
      .where("publicationStatus", "==", "Published")
      .where("consentStatus", "==", "Granted")
      .orderBy("displayOrder")
      .limit(60)
      .get();
    return snap.docs
      .map((d) => fromSnapshot<BeforeAfterCase>(d))
      .filter((c) => !c.deletedAt && c.publicBeforeImageUrl && c.publicAfterImageUrl);
  }, []),
);

export const getBlogPosts = cache(async (limit = 50): Promise<BlogPost[]> =>
  readOrFallback(async () => {
    const snap = await adminDb()
      .collection(C.blogs)
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(limit)
      .get();
    const nowIso = new Date().toISOString();
    return snap.docs
      .map((d) => fromSnapshot<BlogPost>(d))
      .filter((p) => !p.deletedAt && (!p.publishedAt || p.publishedAt <= nowIso));
  }, []),
);

export const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const posts = await getBlogPosts(200);
  return posts.find((p) => p.slug === slug) ?? null;
});

/**
 * A CMS page. Returns the last *published* section snapshot so an in-progress
 * draft is never served to the public.
 */
export const getPage = cache(async (slug: string): Promise<Page | null> =>
  readOrFallback(async () => {
    const snap = await adminDb().collection(C.pages).where("slug", "==", slug).limit(1).get();
    if (snap.empty) return null;
    const page = fromSnapshot<Page>(snap.docs[0]);
    if (page.status !== "published") return null;
    return { ...page, sections: page.publishedSections ?? page.sections };
  }, null),
);
