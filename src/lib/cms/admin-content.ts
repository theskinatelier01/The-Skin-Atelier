import "server-only";

import { adminBucket, adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import { fromSnapshot } from "@/lib/firebase/convert";
import type { Service } from "@/types";
import type { ContentKind } from "./content-kinds";
import {
  DEFAULT_DOCTORS,
  DEFAULT_FAQS,
  DEFAULT_GALLERY,
  DEFAULT_PACKAGES,
  DEFAULT_SERVICES,
  DEFAULT_TESTIMONIALS,
} from "./defaults";

/**
 * Admin-side reads of website content.
 *
 * Unlike the public queries these return hidden and unpublished records too —
 * otherwise anything switched off could never be found again to switch back
 * on. An empty collection shows the bundled defaults, which is exactly what
 * the live site is rendering at that point.
 */

type Row = Record<string, unknown> & { id: string };

const SOURCES: Record<ContentKind, { collection: string; defaults: readonly object[] }> = {
  doctors: { collection: C.doctors, defaults: DEFAULT_DOCTORS },
  packages: { collection: C.packages, defaults: DEFAULT_PACKAGES },
  gallery: { collection: C.gallery, defaults: DEFAULT_GALLERY },
  testimonials: { collection: C.testimonials, defaults: DEFAULT_TESTIMONIALS },
  faqs: { collection: C.faqs, defaults: DEFAULT_FAQS },
  blog: { collection: C.blogs, defaults: [] },
};

function sortRows(kind: ContentKind, rows: Row[]): Row[] {
  if (kind === "blog") {
    return rows.sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
  }
  return rows.sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));
}

export async function getContentForAdmin(kind: ContentKind): Promise<Row[]> {
  const { collection, defaults } = SOURCES[kind];
  if (!isAdminConfigured) return defaults as Row[];

  const snap = await adminDb().collection(collection).get();
  if (snap.empty) return defaults as Row[];
  return sortRows(
    kind,
    snap.docs.map((d) => fromSnapshot<Row>(d)).filter((row) => !row.deletedAt),
  );
}

/** Every treatment, including unpublished ones. */
export async function getAllServicesForAdmin(): Promise<Service[]> {
  if (!isAdminConfigured) return DEFAULT_SERVICES;
  const snap = await adminDb().collection(C.services).get();
  if (snap.empty) return DEFAULT_SERVICES;
  return snap.docs
    .map((d) => fromSnapshot<Service>(d))
    .filter((s) => !s.deletedAt)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

export interface MediaFile {
  path: string;
  name: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt?: string;
}

/** Files under public/media, newest first. */
export async function listMedia(limit = 200): Promise<MediaFile[]> {
  if (!isAdminConfigured) return [];
  try {
    const bucket = adminBucket();
    const [files] = await bucket.getFiles({ prefix: "public/media/", maxResults: limit });
    return files
      .map((file) => {
        const meta = file.metadata;
        const token = String(meta.metadata?.firebaseStorageDownloadTokens ?? "").split(",")[0];
        const encoded = encodeURIComponent(file.name);
        return {
          path: file.name,
          name: file.name.replace(/^public\/media\//, ""),
          url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media${token ? `&token=${token}` : ""}`,
          contentType: String(meta.contentType ?? ""),
          sizeBytes: Number(meta.size ?? 0),
          uploadedAt: meta.timeCreated ? String(meta.timeCreated) : undefined,
        };
      })
      .sort((a, b) => String(b.uploadedAt ?? "").localeCompare(String(a.uploadedAt ?? "")));
  } catch (error) {
    console.error("[media] listing failed", error);
    return [];
  }
}
