"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { z } from "zod";

import { adminDb } from "@/lib/firebase/admin";
import { C } from "@/lib/firebase/collections";
import { requirePermission } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { KINDS, type ContentKind, type FieldDef } from "@/lib/cms/content-kinds";
import { DEFAULT_SERVICES } from "@/lib/cms/defaults";
import { seedCollectionIfEmpty } from "@/lib/cms/seed";
import {
  blogPostSchema,
  doctorSchema,
  faqSchema,
  fieldErrors,
  galleryItemSchema,
  packageSchema,
  testimonialSchema,
} from "@/lib/validation/schemas";
import { readingMinutes, slugify } from "@/lib/utils/format";
import { toActionResult, type ActionResult } from "@/lib/action-result";

/**
 * Generic website content writes for the collections described in
 * `lib/cms/content-kinds.ts`.
 *
 * Every successful write revalidates the whole public site. The site is a few
 * dozen pages, so regenerating them on their next visit is cheap, and an edit
 * can never be stuck behind a page that happened not to be listed.
 */

const COLLECTION: Record<ContentKind, string> = {
  doctors: C.doctors,
  packages: C.packages,
  gallery: C.gallery,
  testimonials: C.testimonials,
  faqs: C.faqs,
  blog: C.blogs,
};

const SCHEMA: Record<ContentKind, z.ZodTypeAny> = {
  doctors: doctorSchema,
  packages: packageSchema,
  gallery: galleryItemSchema,
  testimonials: testimonialSchema,
  faqs: faqSchema,
  blog: blogPostSchema,
};

/** Kinds whose `slug` must be unique, because it is part of a public URL. */
const UNIQUE_SLUG: ContentKind[] = ["doctors", "packages", "blog"];

function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let node = target;
  for (const key of keys.slice(0, -1)) {
    node[key] = (node[key] as Record<string, unknown>) ?? {};
    node = node[key] as Record<string, unknown>;
  }
  node[keys[keys.length - 1]] = value;
}

function readField(field: FieldDef, formData: FormData): unknown {
  const raw = formData.get(field.name);
  switch (field.type) {
    case "checkbox":
      return raw === "on";
    case "number": {
      const text = String(raw ?? "").trim();
      return text === "" ? undefined : Number(text);
    }
    case "lines":
      return String(raw ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    default: {
      const text = String(raw ?? "").trim();
      return text === "" ? undefined : text;
    }
  }
}

/** "HydraFacial | 3" → { serviceId, serviceName, sessions } */
function parsePackageItems(lines: string[]) {
  return lines.map((line) => {
    const [name, rawSessions] = line.split("|");
    const serviceName = name.trim();
    const match = DEFAULT_SERVICES.find((s) => s.name.toLowerCase() === serviceName.toLowerCase());
    const sessions = Number(String(rawSessions ?? "1").replace(/[^\d]/g, "")) || 1;
    return { serviceId: match?.id ?? slugify(serviceName), serviceName, sessions };
  });
}

const isDelete = (v: unknown) => v instanceof FieldValue && v.isEqual(FieldValue.delete());

export async function saveContent(
  kind: ContentKind,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const def = KINDS[kind];
    if (!def) return { ok: false, message: "Unknown content type." };

    const ctx = await requirePermission(def.writePermission);
    const id = (formData.get("id") as string) || undefined;
    const collection = adminDb().collection(COLLECTION[kind]);

    const input: Record<string, unknown> = {};
    for (const field of def.fields) setPath(input, field.name, readField(field, formData));

    if (kind === "packages") {
      const items = parsePackageItems((input.items as string[]) ?? []);
      input.items = items;
      input.totalSessions = items.reduce((sum, item) => sum + item.sessions, 0) || 1;
    }
    if (kind === "blog") {
      if (input.status === "published") await requirePermission("cms.blog.publish");
      if (input.status === "scheduled" && !input.scheduledFor) {
        return { ok: false, errors: { scheduledFor: "Choose when the post should go live." } };
      }
    }
    if ("slug" in input && !input.slug) {
      const source = def.fields.find((f) => f.name === "slug")?.slugFrom;
      if (source) input.slug = slugify(String(input[source] ?? ""));
    }

    const parsed = SCHEMA[kind].safeParse(input);
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const data = parsed.data as Record<string, unknown>;

    if (UNIQUE_SLUG.includes(kind)) {
      const clash = await collection.where("slug", "==", data.slug).limit(2).get();
      if (clash.docs.some((d) => d.id !== id)) {
        return { ok: false, errors: { slug: `Another ${def.singular} already uses this URL.` } };
      }
    }

    const payload: Record<string, unknown> = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ctx.uid,
    };

    if (kind === "testimonials") {
      payload.authorInitial = String(data.authorName ?? "").trim().charAt(0).toUpperCase();
    }
    if (kind === "blog") {
      payload.readingMinutes = readingMinutes(String(data.body ?? ""));
      if (data.status === "published") {
        // Keep the original date when an already-live post is edited.
        const existing = id ? (await collection.doc(id).get()).data() : undefined;
        payload.publishedAt =
          existing?.status === "published" && existing.publishedAt ? existing.publishedAt : Timestamp.now();
      } else if (data.status === "scheduled") {
        payload.publishedAt = Timestamp.fromDate(new Date(String(data.scheduledFor)));
      } else {
        payload.publishedAt = FieldValue.delete();
      }
    }

    // Firestore rejects `undefined`; a field the editor emptied is removed.
    for (const field of def.fields) {
      const top = field.name.split(".")[0];
      if (payload[top] === undefined) payload[top] = FieldValue.delete();
    }

    // Bring the bundled defaults across first, so this edit does not leave it
    // as the only record on the site.
    await seedCollectionIfEmpty(COLLECTION[kind]);

    let savedId = id;
    if (id) {
      // `set` + merge also covers a record that so far existed only as
      // bundled default content.
      await collection.doc(id).set(payload, { merge: true });
    } else {
      const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => !isDelete(v)));
      const ref = await collection.add({
        ...clean,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: ctx.uid,
      });
      savedId = ref.id;
    }

    await writeAuditLog(ctx, {
      action: `${kind}.${id ? "update" : "create"}`,
      module: "Website",
      entityId: savedId,
      entityLabel: String(data[def.titleField] ?? "").slice(0, 80),
    });

    revalidatePath("/", "layout");
    return { ok: true, message: `${capitalise(def.singular)} saved. The website has been updated.` };
  } catch (error) {
    return toActionResult(error, "The changes could not be saved.");
  }
}

export async function deleteContent(kind: ContentKind, id: string): Promise<ActionResult> {
  try {
    const def = KINDS[kind];
    if (!def) return { ok: false, message: "Unknown content type." };
    const ctx = await requirePermission(def.writePermission);

    await seedCollectionIfEmpty(COLLECTION[kind]);
    await adminDb().collection(COLLECTION[kind]).doc(id).delete();
    await writeAuditLog(ctx, { action: `${kind}.delete`, module: "Website", entityId: id });

    revalidatePath("/", "layout");
    return { ok: true, message: `${capitalise(def.singular)} deleted.` };
  } catch (error) {
    return toActionResult(error, "It could not be deleted.");
  }
}

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
