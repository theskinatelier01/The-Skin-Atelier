import type { Permission, Role } from "@/lib/auth/permissions";

/**
 * Domain model.
 *
 * Convention: every timestamp is an **ISO 8601 string** at the application
 * layer, not a Firestore `Timestamp`. Firestore Timestamps are not serialisable
 * across the React Server Component boundary, so the data-access layer converts
 * them once, on read, in `lib/firebase/convert.ts`.
 */

export type ISODate = string;

export interface BaseDoc {
  id: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  createdBy?: string;
  updatedBy?: string;
  /** Soft delete. Every query helper filters these out by default. */
  deletedAt?: ISODate | null;
  /** Marks records produced by the seed script so they can be purged. */
  isDemo?: boolean;
}

/** Every operational record carries a branch so new locations can be added. */
export interface BranchScoped {
  branchId: string;
}

/* ========================================================================== */
/* Organisation                                                               */
/* ========================================================================== */

export interface Branch extends BaseDoc {
  name: string;
  code: string;
  addressLine: string;
  city: string;
  country: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  googleMapsUrl?: string;
  timezone: string;
  openingHours: OpeningHour[];
  isActive: boolean;
  isPrimary: boolean;
}

export interface OpeningHour {
  /** 0 = Sunday */
  day: number;
  open: string;
  close: string;
  closed: boolean;
}

/* ========================================================================== */
/* Identity                                                                   */
/* ========================================================================== */

export interface AppUser extends BaseDoc {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: Role;
  extraPermissions?: Permission[];
  deniedPermissions?: Permission[];
  branchIds: string[];
  staffId?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: ISODate;
}

export interface StaffMember extends BaseDoc, BranchScoped {
  fullName: string;
  role: Role;
  department: string;
  phone: string;
  email?: string;
  joiningDate: ISODate;
  commissionPercent?: number;
  userId?: string;
  isActive: boolean;
  notes?: string;
}

export interface Doctor extends BaseDoc, BranchScoped {
  staffId?: string;
  userId?: string;
  fullName: string;
  slug: string;
  title: string;
  qualifications: string[];
  specialties: string[];
  bio: string;
  photoUrl?: string;
  yearsExperience?: number;
  consultationFee?: number;
  serviceIds: string[];
  languages?: string[];
  isPublished: boolean;
  displayOrder: number;
  seo?: SeoMeta;
}

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DoctorSchedule extends BaseDoc, BranchScoped {
  doctorId: string;
  workingDays: {
    day: WeekdayIndex;
    enabled: boolean;
    start: string;
    end: string;
    breakStart?: string;
    breakEnd?: string;
  }[];
  slotMinutes: number;
  leaves: { from: ISODate; to: ISODate; reason?: string }[];
  holidays: ISODate[];
}

/* ========================================================================== */
/* Services & catalogue                                                       */
/* ========================================================================== */

export const SERVICE_CATEGORIES = [
  "Injectables",
  "Skin Treatments",
  "Laser Treatments",
  "Hair Treatments",
  "Facial Treatments",
  "Body Treatments",
  "Dermatology",
  "Wellness",
] as const;
export type ServiceCategoryName = (typeof SERVICE_CATEGORIES)[number];

export interface ServiceCategory extends BaseDoc {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface Service extends BaseDoc {
  name: string;
  slug: string;
  categoryId: string;
  categoryName: ServiceCategoryName | string;
  shortDescription: string;
  detailedDescription: string;
  benefits: string[];
  suitableFor: string[];
  treatmentProcess: { step: number; title: string; description: string }[];
  durationMinutes: number;
  downtime: string;
  resultsTimeline: string;
  recommendedSessions: string;
  price: number | null;
  discountedPrice?: number | null;
  priceOnConsultation: boolean;
  isFeatured: boolean;
  isActive: boolean;
  showOnHomepage: boolean;
  showInCategory: boolean;
  displayOrder: number;
  coverImageUrl?: string;
  galleryImageUrls: string[];
  faqs: ServiceFaq[];
  relatedServiceIds: string[];
  /** Maps to the homepage "what would you like to improve" finder. */
  concernTags: string[];
  seo?: SeoMeta;
}

export const SKIN_CONCERNS = [
  "Fine Lines & Wrinkles",
  "Acne",
  "Pigmentation",
  "Hair Loss",
  "Dull Skin",
  "Skin Texture",
  "Facial Volume",
  "Scars",
  "Body Contouring",
] as const;
export type SkinConcern = (typeof SKIN_CONCERNS)[number];

export interface Package extends BaseDoc {
  name: string;
  slug: string;
  description: string;
  items: { serviceId: string; serviceName: string; sessions: number }[];
  totalSessions: number;
  price: number;
  compareAtPrice?: number;
  validityDays: number;
  coverImageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  terms?: string;
}

export type MembershipTier = "Basic" | "Premium" | "VIP";

export interface Membership extends BaseDoc {
  name: string;
  tier: MembershipTier;
  description: string;
  price: number;
  durationDays: number;
  discountPercent: number;
  pointsMultiplier: number;
  benefits: string[];
  isActive: boolean;
}

/* ========================================================================== */
/* Patients                                                                   */
/* ========================================================================== */

export type Gender = "Female" | "Male" | "Other" | "Prefer not to say";

export const PATIENT_SOURCES = [
  "Website",
  "WhatsApp",
  "Phone",
  "Walk-in",
  "Instagram",
  "Facebook",
  "Google",
  "Referral",
] as const;
export type PatientSource = (typeof PATIENT_SOURCES)[number];

export interface Patient extends BaseDoc, BranchScoped {
  patientCode: string;
  fullName: string;
  gender: Gender;
  dateOfBirth?: ISODate;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  source: PatientSource;
  registrationDate: ISODate;
  /** Denormalised for fast list rendering; recomputed on write. */
  stats?: {
    totalVisits: number;
    totalSpend: number;
    lastVisitAt?: ISODate;
    outstandingBalance: number;
  };
  membershipId?: string;
  loyaltyPoints?: number;
  tags?: string[];
  isActive: boolean;
}

/**
 * Clinical data lives in its own collection so Firestore rules can gate it
 * behind `patients.medical.read` independently of the directory record.
 */
export interface PatientMedical extends BaseDoc {
  patientId: string;
  allergies: string[];
  skinConcerns: string[];
  skinType?: string;
  contraindications: string[];
  currentMedications?: string[];
  medicalHistory?: string;
  notes?: string;
}

export interface PatientNote extends BaseDoc {
  patientId: string;
  authorId: string;
  authorName: string;
  body: string;
  isClinical: boolean;
  pinned?: boolean;
}

/* ========================================================================== */
/* Appointments                                                               */
/* ========================================================================== */

export const APPOINTMENT_STATUSES = [
  "Booked",
  "Confirmed",
  "Arrived",
  "In Consultation",
  "Treatment",
  "Completed",
  "Cancelled",
  "No Show",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type AppointmentPaymentStatus = "Unpaid" | "Partially Paid" | "Paid";
export type AppointmentType = "Consultation" | "Treatment" | "Follow-up" | "Package Session";

export interface Appointment extends BaseDoc, BranchScoped {
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  /** Local calendar date, `yyyy-MM-dd`, for cheap equality queries. */
  date: string;
  /** `HH:mm`, 24h, clinic-local. */
  startTime: string;
  endTime: string;
  durationMinutes: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  paymentStatus: AppointmentPaymentStatus;
  source: PatientSource;
  notes?: string;
  invoiceId?: string;
  patientPackageId?: string;
  checkedInAt?: ISODate;
  completedAt?: ISODate;
  cancelledAt?: ISODate;
  cancellationReason?: string;
}

/** A public booking form submission - never an appointment until confirmed. */
export interface AppointmentRequest extends BaseDoc {
  branchId?: string;
  fullName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  preferredServiceId?: string;
  preferredServiceName?: string;
  preferredDoctorId?: string;
  preferredDoctorName?: string;
  preferredDate?: string;
  preferredTime?: string;
  message?: string;
  source: PatientSource;
  status: "New" | "Contacted" | "Confirmed" | "Declined" | "Converted";
  handledBy?: string;
  handledAt?: ISODate;
  appointmentId?: string;
  patientId?: string;
  internalNotes?: string;
}

export type QueueStatus = "WAITING" | "CALLED" | "WITH DOCTOR" | "TREATMENT" | "COMPLETED";

export interface QueueEntry extends BaseDoc, BranchScoped {
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  serviceName?: string;
  token: number;
  status: QueueStatus;
  checkedInAt: ISODate;
  calledAt?: ISODate;
  completedAt?: ISODate;
  isWalkIn: boolean;
}

/* ========================================================================== */
/* Clinical records                                                           */
/* ========================================================================== */

export interface Consultation extends BaseDoc, BranchScoped {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  date: ISODate;
  chiefConcern: string;
  skinAssessment: string;
  assessment: string;
  recommendedServiceIds: string[];
  recommendedServiceNames: string[];
  treatmentPlan: string;
  plannedSessions?: number;
  followUpDate?: ISODate;
  notes?: string;
  treatmentPlanId?: string;
}

export interface TreatmentPlan extends BaseDoc, BranchScoped {
  patientId: string;
  consultationId?: string;
  doctorId: string;
  title: string;
  items: {
    serviceId: string;
    serviceName: string;
    sessions: number;
    sessionsCompleted: number;
    intervalDays?: number;
    notes?: string;
  }[];
  status: "Active" | "Completed" | "Cancelled";
  startDate: ISODate;
  estimatedCost?: number;
}

export interface TreatmentRecord extends BaseDoc, BranchScoped {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  treatmentPlanId?: string;
  serviceId: string;
  serviceName: string;
  date: ISODate;
  treatmentArea: string;
  sessionNumber: number;
  productsUsed: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    batchId?: string;
    batchNumber?: string;
  }[];
  notes?: string;
  /** Storage paths, not URLs. Access is always brokered by a signed URL. */
  beforeImagePaths: string[];
  afterImagePaths: string[];
  followUpDate?: ISODate;
  beforeAfterCaseId?: string;
}

export type ConsentStatus = "Not Requested" | "Requested" | "Granted" | "Declined" | "Withdrawn";
export type PublicationStatus = "Private" | "Pending Review" | "Approved" | "Published" | "Rejected";

/**
 * Patient imagery. Defaults are deliberately the most private possible:
 * nothing reaches the public site without an explicit consent record AND an
 * admin approval, both of which are audited.
 */
export interface BeforeAfterCase extends BaseDoc, BranchScoped {
  patientId: string;
  /** Only ever shown publicly when `anonymous` is false and consent is granted. */
  patientNameInternal: string;
  treatmentRecordId?: string;
  serviceId: string;
  serviceName: string;
  treatmentArea: string;
  sessions: number;
  description: string;
  ageRange?: string;
  beforeImagePath: string;
  afterImagePath: string;
  /** Populated by an admin only at approval time. */
  publicBeforeImageUrl?: string;
  publicAfterImageUrl?: string;
  consentStatus: ConsentStatus;
  consentRecordedBy?: string;
  consentRecordedAt?: ISODate;
  consentDocumentPath?: string;
  anonymous: boolean;
  publicationStatus: PublicationStatus;
  approvedBy?: string;
  approvedAt?: ISODate;
  rejectionReason?: string;
  displayOrder: number;
  treatmentDate: ISODate;
}

/* ========================================================================== */
/* Packages held by patients                                                  */
/* ========================================================================== */

export interface PatientPackage extends BaseDoc, BranchScoped {
  patientId: string;
  patientName: string;
  packageId: string;
  packageName: string;
  purchaseDate: ISODate;
  expiryDate: ISODate;
  items: {
    serviceId: string;
    serviceName: string;
    sessionsTotal: number;
    sessionsUsed: number;
  }[];
  sessionsTotal: number;
  sessionsUsed: number;
  pricePaid: number;
  invoiceId?: string;
  paymentStatus: "Paid" | "Partially Paid" | "Unpaid";
  status: "Active" | "Completed" | "Expired" | "Cancelled";
}

/* ========================================================================== */
/* Inventory                                                                  */
/* ========================================================================== */

export const INVENTORY_CATEGORIES = [
  "Injectables",
  "Fillers",
  "Botox",
  "PRP Supplies",
  "Needles",
  "Syringes",
  "Gloves",
  "Masks",
  "Creams",
  "Serums",
  "Skincare Products",
  "Laser Consumables",
  "Facial Consumables",
  "Cleaning Supplies",
  "General Supplies",
] as const;
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export interface Product extends BaseDoc, BranchScoped {
  name: string;
  sku: string;
  category: InventoryCategory | string;
  brand?: string;
  supplierId?: string;
  supplierName?: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  unit: string;
  storageLocation?: string;
  /** Retail products can be sold at the POS; consumables cannot. */
  isRetail: boolean;
  requiresBatchTracking: boolean;
  imageUrl?: string;
  isActive: boolean;
  notes?: string;
}

export interface InventoryBatch extends BaseDoc, BranchScoped {
  productId: string;
  productName: string;
  batchNumber: string;
  quantityReceived: number;
  quantityRemaining: number;
  purchaseDate: ISODate;
  expiryDate: ISODate;
  purchasePrice?: number;
  supplierId?: string;
  supplierName?: string;
  purchaseOrderId?: string;
  status: "Active" | "Depleted" | "Expired" | "Quarantined";
}

export const STOCK_MOVEMENT_TYPES = [
  "STOCK_IN",
  "STOCK_OUT",
  "ADJUSTMENT",
  "EXPIRED",
  "DAMAGED",
  "TRANSFER",
  "WASTAGE",
  "SALE",
  "TREATMENT_USE",
  "RETURN",
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export interface StockMovement extends BaseDoc, BranchScoped {
  productId: string;
  productName: string;
  batchId?: string;
  batchNumber?: string;
  type: StockMovementType;
  /** Positive for inbound, negative for outbound. */
  quantity: number;
  balanceAfter: number;
  unit: string;
  reason?: string;
  reference?: string;
  referenceType?: "PurchaseOrder" | "Invoice" | "TreatmentRecord" | "Manual";
  performedBy: string;
  performedByName: string;
  toBranchId?: string;
}

export interface Supplier extends BaseDoc, BranchScoped {
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
}

export type PurchaseOrderStatus =
  | "Draft"
  | "Ordered"
  | "Partially Received"
  | "Received"
  | "Cancelled";

export interface PurchaseOrder extends BaseDoc, BranchScoped {
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: ISODate;
  expectedDeliveryDate?: ISODate;
  items: {
    productId: string;
    productName: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
    total: number;
    batchNumber?: string;
    expiryDate?: ISODate;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: PurchaseOrderStatus;
  approvedBy?: string;
  approvedAt?: ISODate;
  receivedAt?: ISODate;
  notes?: string;
}

/* ========================================================================== */
/* Sales & finance                                                            */
/* ========================================================================== */

export const PAYMENT_METHODS = [
  "Cash",
  "Card",
  "Bank Transfer",
  "Easypaisa",
  "JazzCash",
  "Other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type InvoiceStatus = "Paid" | "Partially Paid" | "Unpaid" | "Refunded" | "Void";
export type InvoiceLineKind = "service" | "product" | "package" | "membership";

export interface InvoiceLine {
  kind: InvoiceLineKind;
  refId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
  batchId?: string;
}

export interface Invoice extends BaseDoc, BranchScoped {
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  date: ISODate;
  lines: InvoiceLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  appointmentId?: string;
  cashierId: string;
  cashierName: string;
  notes?: string;
  refundedAmount?: number;
  voidedReason?: string;
}

export interface Payment extends BaseDoc, BranchScoped {
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  method: PaymentMethod;
  date: ISODate;
  reference?: string;
  receivedBy: string;
  receivedByName: string;
  isRefund: boolean;
  notes?: string;
}

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Inventory",
  "Marketing",
  "Equipment",
  "Maintenance",
  "Software",
  "Miscellaneous",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense extends BaseDoc, BranchScoped {
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  date: ISODate;
  method: PaymentMethod;
  vendor?: string;
  receiptPath?: string;
  notes?: string;
  recordedBy: string;
  recordedByName: string;
}

/* ========================================================================== */
/* CRM                                                                        */
/* ========================================================================== */

export const LEAD_STAGES = [
  "NEW",
  "CONTACTED",
  "CONSULTATION BOOKED",
  "CONSULTATION COMPLETED",
  "CONVERTED",
  "LOST",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export interface Lead extends BaseDoc, BranchScoped {
  fullName: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  interestedServiceId?: string;
  interestedServiceName?: string;
  source: PatientSource;
  stage: LeadStage;
  assignedToId?: string;
  assignedToName?: string;
  followUpDate?: ISODate;
  notes?: string;
  lostReason?: string;
  convertedPatientId?: string;
  value?: number;
  activities?: { at: ISODate; by: string; type: string; note: string }[];
}

/* ========================================================================== */
/* Website / CMS                                                              */
/* ========================================================================== */

export interface SeoMeta {
  title?: string;
  description?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  keywords?: string[];
}

export const SECTION_TYPES = [
  "hero",
  "text",
  "image",
  "imageText",
  "services",
  "concernFinder",
  "featuredTreatment",
  "doctors",
  "testimonials",
  "gallery",
  "beforeAfter",
  "packages",
  "faq",
  "cta",
  "video",
  "blog",
  "stats",
  "logos",
  "instagram",
  "customHtml",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

/** Loose by design: each section type validates its own shape with zod. */
export type SectionData = Record<string, unknown>;

export interface PageSection {
  id: string;
  type: SectionType;
  /** Shown in the page builder list. */
  label: string;
  enabled: boolean;
  order: number;
  data: SectionData;
}

export interface Page extends BaseDoc {
  slug: string;
  title: string;
  /** Locked pages cannot be deleted - the routes depend on them. */
  isSystem: boolean;
  sections: PageSection[];
  status: "draft" | "published";
  publishedAt?: ISODate;
  /** Snapshot of the last published `sections`, served to the public site. */
  publishedSections?: PageSection[];
  seo?: SeoMeta;
}

export interface MediaFolder extends BaseDoc {
  name: string;
  parentId: string | null;
  path: string;
}

export interface MediaAsset extends BaseDoc {
  filename: string;
  storagePath: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  kind: "image" | "video" | "document";
  folderId: string | null;
  altText?: string;
  title?: string;
  caption?: string;
  usedIn?: { type: string; id: string; label: string }[];
  uploadedByName?: string;
}

export interface BlogPost extends BaseDoc {
  title: string;
  slug: string;
  excerpt: string;
  /** Markdown-ish rich text; rendered with a sanitising renderer. */
  body: string;
  coverImageUrl?: string;
  categories: string[];
  tags: string[];
  authorId?: string;
  authorName: string;
  status: "draft" | "scheduled" | "published";
  publishedAt?: ISODate;
  scheduledFor?: ISODate;
  readingMinutes?: number;
  seo?: SeoMeta;
  isFeatured?: boolean;
}

export interface Testimonial extends BaseDoc {
  authorName: string;
  authorInitial?: string;
  rating: number;
  body: string;
  serviceName?: string;
  source: "Google" | "Instagram" | "In-clinic" | "Facebook" | "Other";
  date?: ISODate;
  isVisible: boolean;
  displayOrder: number;
  avatarUrl?: string;
}

export interface Faq extends BaseDoc {
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isVisible: boolean;
  showOnFaqPage: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  openInNewTab?: boolean;
  children?: MenuItem[];
}

export interface Menu extends BaseDoc {
  key: "primary" | "footer-services" | "footer-clinic" | "legal" | string;
  name: string;
  items: MenuItem[];
}

export interface GalleryItem extends BaseDoc {
  imageUrl: string;
  caption?: string;
  altText: string;
  category?: string;
  linkUrl?: string;
  /** Used for the Instagram-style social rail. */
  isSocial: boolean;
  displayOrder: number;
  isVisible: boolean;
}

/* ========================================================================== */
/* Communication & system                                                     */
/* ========================================================================== */

export const WHATSAPP_TEMPLATE_KEYS = [
  "appointment_confirmation",
  "appointment_reminder",
  "appointment_cancellation",
  "follow_up",
  "payment_reminder",
  "birthday",
  "package_expiry",
  "review_request",
] as const;
export type WhatsAppTemplateKey = (typeof WHATSAPP_TEMPLATE_KEYS)[number];

export interface WhatsAppTemplate extends BaseDoc {
  key: WhatsAppTemplateKey | string;
  name: string;
  /** Uses {{placeholders}} resolved by `renderTemplate`. */
  body: string;
  description?: string;
  availableVariables: string[];
  isActive: boolean;
}

export const NOTIFICATION_TYPES = [
  "NEW_BOOKING",
  "APPOINTMENT_TOMORROW",
  "APPOINTMENT_TODAY",
  "LOW_INVENTORY",
  "EXPIRED_PRODUCT",
  "EXPIRING_PRODUCT",
  "UNPAID_INVOICE",
  "FOLLOW_UP_DUE",
  "NEW_INQUIRY",
  "CONSENT_PENDING",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface AppNotification extends BaseDoc {
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  severity: "info" | "warning" | "critical";
  /** Empty means every role with the permission sees it. */
  targetRoles?: Role[];
  readBy: string[];
  branchId?: string;
  entityId?: string;
}

export interface AuditLog {
  id: string;
  at: ISODate;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  module: string;
  entityId?: string;
  entityLabel?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
  branchId?: string;
}

export interface ClinicSettings extends BaseDoc {
  clinicName: string;
  tagline?: string;
  logoUrl?: string;
  logoLightUrl?: string;
  faviconUrl?: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressLine: string;
  city: string;
  country: string;
  googleMapsUrl?: string;
  googleMapsEmbedUrl?: string;
  googleRating?: number;
  googleReviewCount?: number;
  googleReviewUrl?: string;
  openingHours: OpeningHour[];
  social: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
  };
  currency: string;
  currencySymbol: string;
  taxPercent: number;
  taxLabel: string;
  invoicePrefix: string;
  patientCodePrefix: string;
  appointment: {
    slotMinutes: number;
    bufferMinutes: number;
    maxAdvanceDays: number;
    allowSameDay: boolean;
  };
  seoDefaults: SeoMeta;
  announcementBar?: { enabled: boolean; text: string; href?: string };
  /** Master switch consumed by the public booking form. */
  onlineBookingEnabled: boolean;
}

/* ========================================================================== */
/* Helpers                                                                    */
/* ========================================================================== */

/** Payload shape when writing: ids and timestamps are set by the server. */
export type NewDoc<T extends BaseDoc> = Omit<T, "id" | "createdAt" | "updatedAt">;
export type UpdateDoc<T extends BaseDoc> = Partial<Omit<T, "id" | "createdAt">>;

export interface Paginated<T> {
  items: T[];
  cursor: string | null;
  hasMore: boolean;
}
