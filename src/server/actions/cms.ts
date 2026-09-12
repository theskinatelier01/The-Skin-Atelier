"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { C, SETTINGS_DOC_ID } from "@/lib/firebase/collections";
import { requirePermission } from "@/lib/auth/session";
import { diff, writeAuditLog } from "@/lib/audit";
import {
  blogPostSchema,
  faqSchema,
  fieldErrors,
  serviceSchema,
  settingsSchema,
  testimonialSchema,
} from "@/lib/validation/schemas";
import { readingMinutes, slugify } from "@/lib/utils/format";
import { toActionResult, type ActionResult } from "@/lib/action-result";

/**
 * Website content management.
 *
 * Every write revalidates the public routes it affects, so an edit made in the
 * admin appears on the live site within the same request rather than waiting
 * for the next scheduled revalidation.
 */

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return String(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveService(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult & { serviceId?: string }> {
  try {
    const ctx = await requirePermission("cms.services.write");

    const id = (formData.get("id") as string) || undefined;
    const name = String(formData.get("name") ?? "");

    const parsed = serviceSchema.safeParse({
      name,
      slug: String(formData.get("slug") || slugify(name)),
      categoryId: formData.get("categoryId"),
      categoryName: formData.get("categoryName"),
      shortDescription: formData.get("shortDescription"),
      detailedDescription: formData.get("detailedDescription") ?? "",
      benefits: parseList(formData.get("benefits")),
      suitableFor: parseList(formData.get("suitableFor")),
      treatmentProcess: [],
      durationMinutes: formData.get("durationMinutes"),
      downtime: formData.get("downtime") ?? "",
      resultsTimeline: formData.get("resultsTimeline") ?? "",
      recommendedSessions: formData.get("recommendedSessions") ?? "",
      price: formData.get("price") ? Number(formData.get("price")) : null,
      discountedPrice: formData.get("discountedPrice")
        ? Number(formData.get("discountedPrice"))
        : null,
      priceOnConsultation: formData.get("priceOnConsultation") === "on",
      isFeatured: formData.get("isFeatured") === "on",
      isActive: formData.get("isActive") === "on",
      showOnHomepage: formData.get("showOnHomepage") === "on",
      showInCategory: formData.get("showInCategory") === "on",
      displayOrder: formData.get("displayOrder") ?? 0,
      coverImageUrl: formData.get("coverImageUrl") || "",
      galleryImageUrls: [],
      faqs: [],
      relatedServiceIds: [],
      concernTags: formData.getAll("concernTags").map(String),
      seo: {
        title: (formData.get("seoTitle") as string) || undefined,
        description: (formData.get("seoDescription") as string) || undefined,
      },
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    // A slug change breaks an indexed URL, so it must stay unique.
    const clash = await adminDb()
      .collection(C.services)
      .where("slug", "==", parsed.data.slug)
      .limit(1)
      .get();
    if (!clash.empty && clash.docs[0].id !== id) {
      return { ok: false, errors: { slug: "Another treatment already uses this URL." } };
    }

    const payload = {
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ctx.uid,
    };

    let serviceId = id;
    if (serviceId) {
      const beforeSnap = await adminDb().collection(C.services).doc(serviceId).get();
      const before = beforeSnap.data();
      await adminDb().collection(C.services).doc(serviceId).update(payload);

      const changes = diff(
        { price: before?.price, isActive: before?.isActive, slug: before?.slug },
        { price: parsed.data.price, isActive: parsed.data.isActive, slug: parsed.data.slug },
      );
      await writeAuditLog(ctx, {
        action: "service.update",
        module: "Website",
        entityId: serviceId,
        entityLabel: parsed.data.name,
        before: changes.before,
        after: changes.after,
      });
    } else {
      const ref = await adminDb()
        .collection(C.services)
        .add({ ...payload, createdAt: FieldValue.serverTimestamp(), createdBy: ctx.uid });
      serviceId = ref.id;
      await writeAuditLog(ctx, {
        action: "service.create",
        module: "Website",
        entityId: serviceId,
        entityLabel: parsed.data.name,
      });
    }

    revalidatePath("/services");
    revalidatePath(`/services/${parsed.data.slug}`);
    revalidatePath("/");
    revalidatePath("/admin/website/services");
    return { ok: true, message: "Treatment saved and published.", serviceId };
  } catch (error) {
    return toActionResult(error, "The treatment could not be saved.");
  }
}

/** Fast toggle from the list view, without opening the editor. */
export async function toggleServiceFlag(
  serviceId: string,
  field: "isActive" | "isFeatured" | "showOnHomepage",
  value: boolean,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("cms.services.write");

    await adminDb()
      .collection(C.services)
      .doc(serviceId)
      .update({ [field]: value, updatedAt: FieldValue.serverTimestamp(), updatedBy: ctx.uid });

    await writeAuditLog(ctx, {
      action: `service.${field}`,
      module: "Website",
      entityId: serviceId,
      after: { [field]: value },
    });

    revalidatePath("/services");
    revalidatePath("/");
    revalidatePath("/admin/website/services");
    return { ok: true };
  } catch (error) {
    return toActionResult(error, "The change could not be saved.");
  }
}

/* -------------------------------------------------------------------------- */
/* Testimonials                                                                */
/* -------------------------------------------------------------------------- */

export async function saveTestimonial(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("cms.testimonials.write");

    const id = (formData.get("id") as string) || undefined;
    const parsed = testimonialSchema.safeParse({
      authorName: formData.get("authorName"),
      rating: formData.get("rating"),
      body: formData.get("body"),
      serviceName: formData.get("serviceName") || undefined,
      source: formData.get("source"),
      isVisible: formData.get("isVisible") === "on",
      displayOrder: formData.get("displayOrder") ?? 0,
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const payload = { ...parsed.data, updatedAt: FieldValue.serverTimestamp(), updatedBy: ctx.uid };

    if (id) await adminDb().collection(C.testimonials).doc(id).update(payload);
    else
      await adminDb()
        .collection(C.testimonials)
        .add({ ...payload, createdAt: FieldValue.serverTimestamp(), createdBy: ctx.uid });

    await writeAuditLog(ctx, {
      action: id ? "testimonial.update" : "testimonial.create",
      module: "Website",
      entityId: id,
      entityLabel: parsed.data.authorName,
    });

    revalidatePath("/");
    revalidatePath("/admin/website/testimonials");
    return { ok: true, message: "Testimonial saved." };
  } catch (error) {
    return toActionResult(error, "The testimonial could not be saved.");
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("cms.testimonials.write");
    await adminDb().collection(C.testimonials).doc(id).delete();
    await writeAuditLog(ctx, { action: "testimonial.delete", module: "Website", entityId: id });
    revalidatePath("/");
    revalidatePath("/admin/website/testimonials");
    return { ok: true, message: "Testimonial removed." };
  } catch (error) {
    return toActionResult(error, "The testimonial could not be removed.");
  }
}

/* -------------------------------------------------------------------------- */
/* FAQs                                                                        */
/* -------------------------------------------------------------------------- */

export async function saveFaq(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("cms.faqs.write");

    const id = (formData.get("id") as string) || undefined;
    const parsed = faqSchema.safeParse({
      question: formData.get("question"),
      answer: formData.get("answer"),
      category: formData.get("category") || "General",
      displayOrder: formData.get("displayOrder") ?? 0,
      isVisible: formData.get("isVisible") === "on",
      showOnFaqPage: formData.get("showOnFaqPage") === "on",
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const payload = { ...parsed.data, updatedAt: FieldValue.serverTimestamp(), updatedBy: ctx.uid };

    if (id) await adminDb().collection(C.faqs).doc(id).update(payload);
    else
      await adminDb()
        .collection(C.faqs)
        .add({ ...payload, createdAt: FieldValue.serverTimestamp(), createdBy: ctx.uid });

    await writeAuditLog(ctx, {
      action: id ? "faq.update" : "faq.create",
      module: "Website",
      entityId: id,
      entityLabel: parsed.data.question.slice(0, 80),
    });

    revalidatePath("/faq");
    revalidatePath("/admin/website/faq");
    return { ok: true, message: "FAQ saved." };
  } catch (error) {
    return toActionResult(error, "The FAQ could not be saved.");
  }
}

/* -------------------------------------------------------------------------- */
/* Blog                                                                        */
/* -------------------------------------------------------------------------- */

export async function saveBlogPost(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("cms.blog.write");

    const id = (formData.get("id") as string) || undefined;
    const title = String(formData.get("title") ?? "");
    const status = String(formData.get("status") ?? "draft") as "draft" | "scheduled" | "published";

    // Publishing is a separate permission from writing.
    if (status === "published") await requirePermission("cms.blog.publish");

    const parsed = blogPostSchema.safeParse({
      title,
      slug: String(formData.get("slug") || slugify(title)),
      excerpt: formData.get("excerpt"),
      body: formData.get("body"),
      coverImageUrl: formData.get("coverImageUrl") || undefined,
      categories: parseList(formData.get("categories")),
      tags: parseList(formData.get("tags")),
      authorName: formData.get("authorName"),
      status,
      scheduledFor: formData.get("scheduledFor") || undefined,
      seo: {
        title: (formData.get("seoTitle") as string) || undefined,
        description: (formData.get("seoDescription") as string) || undefined,
      },
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const clash = await adminDb()
      .collection(C.blogs)
      .where("slug", "==", parsed.data.slug)
      .limit(1)
      .get();
    if (!clash.empty && clash.docs[0].id !== id) {
      return { ok: false, errors: { slug: "Another post already uses this URL." } };
    }

    const payload: Record<string, unknown> = {
      ...parsed.data,
      readingMinutes: readingMinutes(parsed.data.body),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ctx.uid,
    };

    // `publishedAt` drives both ordering and the "is it live yet" check.
    if (status === "published") {
      payload.publishedAt = Timestamp.now();
    } else if (status === "scheduled" && parsed.data.scheduledFor) {
      payload.publishedAt = Timestamp.fromDate(new Date(parsed.data.scheduledFor));
    }

    if (id) await adminDb().collection(C.blogs).doc(id).update(payload);
    else
      await adminDb()
        .collection(C.blogs)
        .add({ ...payload, createdAt: FieldValue.serverTimestamp(), createdBy: ctx.uid });

    await writeAuditLog(ctx, {
      action: id ? "blog.update" : "blog.create",
      module: "Website",
      entityId: id,
      entityLabel: parsed.data.title,
      after: { status },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${parsed.data.slug}`);
    revalidatePath("/admin/website/blog");
    return { ok: true, message: `Post saved as ${status}.` };
  } catch (error) {
    return toActionResult(error, "The post could not be saved.");
  }
}

/* -------------------------------------------------------------------------- */
/* Before / after publication                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Promotes a case to the public gallery.
 *
 * Two independent conditions must hold: consent has been recorded as granted,
 * and an administrator has approved it. Both are checked here as well as in the
 * Firestore rules, so a mistake in either layer alone cannot expose a patient
 * photograph.
 */
export async function publishBeforeAfterCase(
  caseId: string,
  publicBeforeImageUrl: string,
  publicAfterImageUrl: string,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("cms.beforeAfter.approve");

    const ref = adminDb().collection(C.beforeAfterCases).doc(caseId);
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, message: "Case not found." };

    const data = snap.data() as { consentStatus?: string; patientNameInternal?: string };

    if (data.consentStatus !== "Granted") {
      return {
        ok: false,
        message:
          "This case cannot be published: the patient has not granted written consent for publication.",
      };
    }

    await ref.update({
      publicationStatus: "Published",
      publicBeforeImageUrl,
      publicAfterImageUrl,
      approvedBy: ctx.uid,
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await writeAuditLog(ctx, {
      action: "beforeAfter.publish",
      module: "Website",
      entityId: caseId,
      entityLabel: data.patientNameInternal,
      after: { publicationStatus: "Published" },
    });

    revalidatePath("/results");
    revalidatePath("/");
    revalidatePath("/admin/website/before-after");
    return { ok: true, message: "Case published to the website." };
  } catch (error) {
    return toActionResult(error, "The case could not be published.");
  }
}

/** Removes a case from the public site, for example when consent is withdrawn. */
export async function unpublishBeforeAfterCase(
  caseId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("cms.beforeAfter.approve");

    await adminDb()
      .collection(C.beforeAfterCases)
      .doc(caseId)
      .update({
        publicationStatus: "Private",
        // The public copies are cleared, not just hidden.
        publicBeforeImageUrl: FieldValue.delete(),
        publicAfterImageUrl: FieldValue.delete(),
        rejectionReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: ctx.uid,
      });

    await writeAuditLog(ctx, {
      action: "beforeAfter.unpublish",
      module: "Website",
      entityId: caseId,
      after: { reason },
    });

    revalidatePath("/results");
    revalidatePath("/");
    revalidatePath("/admin/website/before-after");
    return { ok: true, message: "Case removed from the website." };
  } catch (error) {
    return toActionResult(error, "The case could not be unpublished.");
  }
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export async function saveSettings(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const ctx = await requirePermission("cms.settings.write");

    const parsed = settingsSchema.safeParse({
      clinicName: formData.get("clinicName"),
      tagline: formData.get("tagline") || undefined,
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp"),
      email: formData.get("email"),
      addressLine: formData.get("addressLine"),
      city: formData.get("city"),
      country: formData.get("country"),
      googleMapsUrl: formData.get("googleMapsUrl") || "",
      googleRating: formData.get("googleRating") || undefined,
      googleReviewCount: formData.get("googleReviewCount") || undefined,
      currency: formData.get("currency"),
      currencySymbol: formData.get("currencySymbol"),
      taxPercent: formData.get("taxPercent") ?? 0,
      invoicePrefix: formData.get("invoicePrefix"),
      patientCodePrefix: formData.get("patientCodePrefix"),
      onlineBookingEnabled: formData.get("onlineBookingEnabled") === "on",
    });

    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

    const ref = adminDb().collection(C.settings).doc(SETTINGS_DOC_ID);
    const before = (await ref.get()).data();

    await ref.set(
      {
        ...parsed.data,
        announcementBar: {
          enabled: formData.get("announcementEnabled") === "on",
          text: String(formData.get("announcementText") ?? ""),
          href: String(formData.get("announcementHref") ?? ""),
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: ctx.uid,
      },
      { merge: true },
    );

    const changes = diff(before ?? null, parsed.data as Record<string, unknown>);
    await writeAuditLog(ctx, {
      action: "settings.update",
      module: "Website",
      entityLabel: "Clinic settings",
      before: changes.before,
      after: changes.after,
    });

    // Settings appear on every page, so the whole public site is revalidated.
    revalidatePath("/", "layout");
    return { ok: true, message: "Settings saved and published." };
  } catch (error) {
    return toActionResult(error, "The settings could not be saved.");
  }
}
