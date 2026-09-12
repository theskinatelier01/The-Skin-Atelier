"use server";

import { headers } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { C, DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";
import { appointmentRequestSchema, contactSchema, fieldErrors } from "@/lib/validation/schemas";
import { getDoctors, getServices } from "@/lib/cms/queries";
import type { ActionResult } from "@/lib/action-result";

/**
 * Public-facing server actions.
 *
 * These are the only write paths open to unauthenticated visitors, so each one
 * validates strictly, rate-limits by IP, and writes a *request* rather than a
 * confirmed record. Nothing a visitor submits ever becomes a booked appointment
 * without a staff member confirming it.
 */

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

/**
 * In-memory fixed-window limiter.
 *
 * Adequate for a single-region deployment and costs nothing. If the site is
 * ever scaled to multiple instances this should move to Firestore or Redis,
 * since each instance currently keeps its own counter.
 */
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return true;
  }
  if (entry.count >= RATE_LIMIT.max) return false;

  entry.count += 1;
  return true;
}

// Keep the map from growing without bound on a long-lived instance.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) if (now > entry.resetAt) attempts.delete(key);
}, RATE_LIMIT.windowMs).unref?.();

async function clientKey(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

/* -------------------------------------------------------------------------- */
/* Booking request                                                            */
/* -------------------------------------------------------------------------- */

export async function submitAppointmentRequest(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || undefined,
    preferredServiceId: formData.get("preferredServiceId") || undefined,
    preferredDoctorId: formData.get("preferredDoctorId") || undefined,
    preferredDate: formData.get("preferredDate") || undefined,
    preferredTime: formData.get("preferredTime") || undefined,
    message: formData.get("message") || undefined,
    consent: formData.get("consent") === "on" || formData.get("consent") === "true",
    website: formData.get("website") ?? "",
  };

  const parsed = appointmentRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  // A filled honeypot is a bot. Return success so it learns nothing.
  if (parsed.data.website) return { ok: true, message: "Thank you — we will be in touch shortly." };

  if (!rateLimit(await clientKey())) {
    return {
      ok: false,
      message:
        "You have submitted several requests recently. Please call the clinic on 0337 5977799 if this is urgent.",
    };
  }

  if (!isAdminConfigured) {
    return {
      ok: false,
      message:
        "Online booking is not connected yet. Please call 0337 5977799 or message us on WhatsApp.",
    };
  }

  try {
    // Resolve names server-side so the front desk never sees a bare id, and so
    // a tampered form cannot inject an arbitrary service name.
    const [services, doctors] = await Promise.all([getServices(), getDoctors()]);
    const service = services.find((s) => s.id === parsed.data.preferredServiceId);
    const doctor = doctors.find((d) => d.id === parsed.data.preferredDoctorId);

    await adminDb()
      .collection(C.appointmentRequests)
      .add({
        branchId: DEFAULT_BRANCH_ID,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp ?? parsed.data.phone,
        email: parsed.data.email ?? null,
        preferredServiceId: service?.id ?? null,
        preferredServiceName: service?.name ?? null,
        preferredDoctorId: doctor?.id ?? null,
        preferredDoctorName: doctor?.fullName ?? null,
        preferredDate: parsed.data.preferredDate || null,
        preferredTime: parsed.data.preferredTime || null,
        message: parsed.data.message ?? null,
        source: "Website",
        status: "New",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    // Surface it to the front desk immediately.
    await adminDb()
      .collection(C.notifications)
      .add({
        type: "NEW_BOOKING",
        title: "New booking request",
        body: `${parsed.data.fullName} requested ${service?.name ?? "a consultation"}.`,
        href: "/admin/clinic/requests",
        severity: "info",
        targetRoles: ["SUPER_ADMIN", "ADMIN", "FRONT_DESK", "RECEPTIONIST"],
        readBy: [],
        branchId: DEFAULT_BRANCH_ID,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return {
      ok: true,
      message:
        "Thank you. We have received your request and the clinic will contact you shortly to confirm a time.",
    };
  } catch (error) {
    console.error("[booking] failed to record request", error);
    return {
      ok: false,
      message: "Something went wrong on our side. Please call 0337 5977799 and we will book you in.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Contact enquiry                                                            */
/* -------------------------------------------------------------------------- */

export async function submitContactEnquiry(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
    consent: formData.get("consent") === "on" || formData.get("consent") === "true",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (parsed.data.website) return { ok: true, message: "Thank you — we will be in touch." };

  if (!rateLimit(await clientKey())) {
    return { ok: false, message: "Please wait a few minutes before sending another message." };
  }

  if (!isAdminConfigured) {
    return {
      ok: false,
      message: "Messaging is not connected yet. Please call 0337 5977799 or use WhatsApp.",
    };
  }

  try {
    // A website enquiry enters the CRM as a lead, not as a loose message.
    await adminDb()
      .collection(C.leads)
      .add({
        branchId: DEFAULT_BRANCH_ID,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        whatsapp: parsed.data.phone,
        source: "Website",
        stage: "NEW",
        notes: [parsed.data.subject, parsed.data.message].filter(Boolean).join("\n\n"),
        activities: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    await adminDb()
      .collection(C.notifications)
      .add({
        type: "NEW_INQUIRY",
        title: "New website enquiry",
        body: `${parsed.data.fullName} sent a message through the contact form.`,
        href: "/admin/clinic/leads",
        severity: "info",
        targetRoles: ["SUPER_ADMIN", "ADMIN", "FRONT_DESK", "MARKETING_MANAGER"],
        readBy: [],
        branchId: DEFAULT_BRANCH_ID,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return { ok: true, message: "Thank you. We have received your message and will reply shortly." };
  } catch (error) {
    console.error("[contact] failed to record enquiry", error);
    return { ok: false, message: "Something went wrong. Please call 0337 5977799." };
  }
}
