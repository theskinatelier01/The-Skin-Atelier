import { z } from "zod";

import {
  APPOINTMENT_STATUSES,
  EXPENSE_CATEGORIES,
  LEAD_STAGES,
  PATIENT_SOURCES,
  PAYMENT_METHODS,
  STOCK_MOVEMENT_TYPES,
} from "@/types";

/**
 * Validation schemas.
 *
 * These run on the server inside every action. Client-side validation uses the
 * same schemas through `@hookform/resolvers`, so the two can never disagree.
 */

/** Pakistani mobile and landline formats, with or without country code. */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Phone number is too long")
  .regex(/^[+()\d\s-]+$/, "Phone number contains invalid characters");

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(254)
  .or(z.literal(""))
  .optional();

const nameSchema = z
  .string()
  .trim()
  .min(2, "Enter a full name")
  .max(120, "Name is too long");

/* -------------------------------------------------------------------------- */
/* Public booking request                                                     */
/* -------------------------------------------------------------------------- */

export const appointmentRequestSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  whatsapp: z.string().trim().max(20).optional(),
  email: emailSchema,
  preferredServiceId: z.string().trim().max(80).optional(),
  preferredDoctorId: z.string().trim().max(80).optional(),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date")
    .optional()
    .or(z.literal("")),
  preferredTime: z.string().max(20).optional(),
  message: z.string().trim().max(1500, "Message is too long").optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please confirm you agree to be contacted" }),
  }),
  /** Honeypot: a real person never fills this in. */
  website: z.string().max(0).optional(),
});

export type AppointmentRequestInput = z.infer<typeof appointmentRequestSchema>;

export const contactSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(5, "Please tell us how we can help").max(2000),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please confirm you agree to be contacted" }),
  }),
  website: z.string().max(0).optional(),
});

/* -------------------------------------------------------------------------- */
/* Clinic operations                                                          */
/* -------------------------------------------------------------------------- */

export const patientSchema = z.object({
  fullName: nameSchema,
  gender: z.enum(["Female", "Male", "Other", "Prefer not to say"]),
  dateOfBirth: z.string().optional(),
  phone: phoneSchema,
  whatsapp: z.string().trim().max(20).optional(),
  email: emailSchema,
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(20).optional(),
  source: z.enum(PATIENT_SOURCES),
  branchId: z.string().min(1),
});

export const appointmentSchema = z
  .object({
    patientId: z.string().min(1, "Select a patient"),
    doctorId: z.string().min(1, "Select a clinician"),
    serviceId: z.string().min(1, "Select a treatment"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time"),
    durationMinutes: z.coerce.number().int().min(5).max(480),
    appointmentType: z.enum(["Consultation", "Treatment", "Follow-up", "Package Session"]),
    status: z.enum(APPOINTMENT_STATUSES).default("Booked"),
    source: z.enum(PATIENT_SOURCES).default("Phone"),
    notes: z.string().trim().max(1000).optional(),
    branchId: z.string().min(1),
  })
  .refine(
    (v) => {
      // Guards against an end time that would roll past midnight.
      const [h, m] = v.startTime.split(":").map(Number);
      return h * 60 + m + v.durationMinutes <= 24 * 60;
    },
    { message: "This appointment would run past midnight", path: ["durationMinutes"] },
  );

export const consultationSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  appointmentId: z.string().optional(),
  chiefConcern: z.string().trim().min(2, "Record the presenting concern").max(1000),
  skinAssessment: z.string().trim().max(3000).optional().default(""),
  assessment: z.string().trim().min(2, "Record your assessment").max(3000),
  recommendedServiceIds: z.array(z.string()).default([]),
  treatmentPlan: z.string().trim().max(3000).optional().default(""),
  plannedSessions: z.coerce.number().int().min(0).max(60).optional(),
  followUpDate: z.string().optional(),
  notes: z.string().trim().max(3000).optional(),
  branchId: z.string().min(1),
});

export const treatmentRecordSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  appointmentId: z.string().optional(),
  date: z.string(),
  treatmentArea: z.string().trim().min(1, "Record the treated area").max(200),
  sessionNumber: z.coerce.number().int().min(1).max(100),
  productsUsed: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        quantity: z.coerce.number().positive(),
        unit: z.string(),
        batchId: z.string().optional(),
        batchNumber: z.string().optional(),
      }),
    )
    .default([]),
  notes: z.string().trim().max(3000).optional(),
  followUpDate: z.string().optional(),
  branchId: z.string().min(1),
});

export const leadSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  whatsapp: z.string().trim().max(20).optional(),
  interestedServiceId: z.string().optional(),
  source: z.enum(PATIENT_SOURCES),
  stage: z.enum(LEAD_STAGES).default("NEW"),
  assignedToId: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
  value: z.coerce.number().min(0).optional(),
  branchId: z.string().min(1),
});

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  categoryId: z.string().min(1, "Choose a category"),
  categoryName: z.string().min(1),
  shortDescription: z.string().trim().min(10, "Write a short description").max(400),
  detailedDescription: z.string().trim().max(20000).default(""),
  benefits: z.array(z.string().max(300)).default([]),
  suitableFor: z.array(z.string().max(300)).default([]),
  treatmentProcess: z
    .array(
      z.object({
        step: z.coerce.number().int().min(1),
        title: z.string().max(120),
        description: z.string().max(1000),
      }),
    )
    .default([]),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  downtime: z.string().trim().max(300).default(""),
  resultsTimeline: z.string().trim().max(300).default(""),
  recommendedSessions: z.string().trim().max(200).default(""),
  price: z.coerce.number().min(0).nullable().default(null),
  discountedPrice: z.coerce.number().min(0).nullable().optional(),
  priceOnConsultation: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  showOnHomepage: z.boolean().default(false),
  showInCategory: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  galleryImageUrls: z.array(z.string()).default([]),
  faqs: z.array(z.object({ question: z.string().max(300), answer: z.string().max(3000) })).default([]),
  relatedServiceIds: z.array(z.string()).default([]),
  concernTags: z.array(z.string()).default([]),
  seo: z
    .object({
      title: z.string().max(70).optional(),
      description: z.string().max(180).optional(),
      ogImageUrl: z.string().optional(),
      noindex: z.boolean().optional(),
    })
    .optional(),
});

/* -------------------------------------------------------------------------- */
/* Inventory                                                                  */
/* -------------------------------------------------------------------------- */

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  sku: z.string().trim().min(1, "SKU is required").max(60),
  category: z.string().min(1),
  brand: z.string().trim().max(120).optional(),
  supplierId: z.string().optional(),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  currentStock: z.coerce.number().min(0).default(0),
  minimumStock: z.coerce.number().min(0).default(0),
  unit: z.string().trim().min(1).max(24),
  storageLocation: z.string().trim().max(120).optional(),
  isRetail: z.boolean().default(false),
  requiresBatchTracking: z.boolean().default(true),
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(1000).optional(),
  branchId: z.string().min(1),
});

export const stockMovementSchema = z
  .object({
    productId: z.string().min(1),
    batchId: z.string().optional(),
    type: z.enum(STOCK_MOVEMENT_TYPES),
    quantity: z.coerce.number().refine((n) => n !== 0, "Quantity cannot be zero"),
    reason: z.string().trim().max(500).optional(),
    reference: z.string().trim().max(120).optional(),
    branchId: z.string().min(1),
  })
  .refine(
    (v) => {
      // Outbound movement types must carry a negative quantity, so the ledger
      // can be summed without inspecting the type.
      const outbound = ["STOCK_OUT", "EXPIRED", "DAMAGED", "WASTAGE", "SALE", "TREATMENT_USE"];
      return outbound.includes(v.type) ? v.quantity < 0 : true;
    },
    { message: "Outbound movements must use a negative quantity", path: ["quantity"] },
  );

export const batchSchema = z
  .object({
    productId: z.string().min(1),
    batchNumber: z.string().trim().min(1, "Batch number is required").max(80),
    quantityReceived: z.coerce.number().positive("Quantity must be greater than zero"),
    purchaseDate: z.string(),
    expiryDate: z.string(),
    purchasePrice: z.coerce.number().min(0).optional(),
    supplierId: z.string().optional(),
    branchId: z.string().min(1),
  })
  .refine((v) => new Date(v.expiryDate) > new Date(v.purchaseDate), {
    message: "Expiry date must be after the purchase date",
    path: ["expiryDate"],
  });

export const supplierSchema = z.object({
  name: z.string().trim().min(2).max(160),
  company: z.string().trim().max(160).optional(),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().trim().max(300).optional(),
  taxNumber: z.string().trim().max(60).optional(),
  paymentTerms: z.string().trim().max(120).optional(),
  contactPerson: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  isActive: z.boolean().default(true),
  branchId: z.string().min(1),
});

/* -------------------------------------------------------------------------- */
/* Finance                                                                    */
/* -------------------------------------------------------------------------- */

export const invoiceLineSchema = z.object({
  kind: z.enum(["service", "product", "package", "membership"]),
  refId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  batchId: z.string().optional(),
});

export const invoiceSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  lines: z.array(invoiceLineSchema).min(1, "Add at least one item"),
  appointmentId: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
  branchId: z.string().min(1),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  isRefund: z.boolean().default(false),
  branchId: z.string().min(1),
});

export const expenseSchema = z.object({
  title: z.string().trim().min(2).max(200),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  date: z.string(),
  method: z.enum(PAYMENT_METHODS),
  vendor: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(1000).optional(),
  branchId: z.string().min(1),
});

/* -------------------------------------------------------------------------- */
/* Website CMS                                                                */
/* -------------------------------------------------------------------------- */

export const blogPostSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  excerpt: z.string().trim().min(10, "Write a short excerpt").max(400),
  body: z.string().trim().min(20, "The post needs some content"),
  coverImageUrl: z.string().optional(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  authorName: z.string().trim().min(2).max(120),
  status: z.enum(["draft", "scheduled", "published"]).default("draft"),
  scheduledFor: z.string().optional(),
  seo: z
    .object({
      title: z.string().max(70).optional(),
      description: z.string().max(180).optional(),
      ogImageUrl: z.string().optional(),
      noindex: z.boolean().optional(),
    })
    .optional(),
});

export const testimonialSchema = z.object({
  authorName: z.string().trim().min(2).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(2000),
  serviceName: z.string().trim().max(160).optional(),
  source: z.enum(["Google", "Instagram", "In-clinic", "Facebook", "Other"]),
  isVisible: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5).max(300),
  answer: z.string().trim().min(5).max(3000),
  category: z.string().trim().max(80).default("General"),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  showOnFaqPage: z.boolean().default(true),
});

/**
 * Before/after publication.
 *
 * Consent and anonymity are part of the same schema as the images, so a case
 * cannot be constructed without an explicit decision on both.
 */
export const beforeAfterSchema = z.object({
  patientId: z.string().min(1),
  serviceId: z.string().min(1),
  treatmentRecordId: z.string().optional(),
  treatmentArea: z.string().trim().min(1).max(200),
  sessions: z.coerce.number().int().min(1).max(100),
  description: z.string().trim().min(10, "Describe the case").max(1000),
  ageRange: z.string().trim().max(40).optional(),
  treatmentDate: z.string(),
  anonymous: z.boolean().default(true),
  consentStatus: z.enum(["Not Requested", "Requested", "Granted", "Declined", "Withdrawn"]),
  branchId: z.string().min(1),
});

export const settingsSchema = z.object({
  clinicName: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(160).optional(),
  phone: phoneSchema,
  whatsapp: z.string().trim().min(7).max(20),
  email: z.string().email(),
  addressLine: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
  googleRating: z.coerce.number().min(0).max(5).optional(),
  googleReviewCount: z.coerce.number().int().min(0).optional(),
  currency: z.string().trim().min(1).max(8),
  currencySymbol: z.string().trim().min(1).max(8),
  taxPercent: z.coerce.number().min(0).max(100),
  invoicePrefix: z.string().trim().min(1).max(10),
  patientCodePrefix: z.string().trim().min(1).max(10),
  onlineBookingEnabled: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Flattens a ZodError into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
