/**
 * Central registry of Firestore collection names.
 *
 * Nothing in the codebase should type a collection name as a string literal -
 * importing from here keeps the security rules, the seed script and the data
 * access layer in agreement.
 */
export const C = {
  // identity
  users: "users",
  staff: "staff",
  doctors: "doctors",
  doctorSchedules: "doctorSchedules",

  // organisation
  branches: "branches",
  settings: "settings",

  // catalogue
  services: "services",
  serviceCategories: "serviceCategories",
  packages: "packages",
  memberships: "memberships",

  // patients
  patients: "patients",
  patientMedical: "patientMedical",
  patientNotes: "patientNotes",
  patientPackages: "patientPackages",

  // scheduling
  appointments: "appointments",
  appointmentRequests: "appointmentRequests",
  queue: "queue",

  // clinical
  consultations: "consultations",
  treatments: "treatments",
  treatmentPlans: "treatmentPlans",
  beforeAfterCases: "beforeAfterCases",

  // inventory
  products: "products",
  inventoryBatches: "inventoryBatches",
  stockMovements: "stockMovements",
  suppliers: "suppliers",
  purchaseOrders: "purchaseOrders",

  // finance
  invoices: "invoices",
  payments: "payments",
  expenses: "expenses",

  // crm
  leads: "leads",

  // website
  pages: "pages",
  blogs: "blogs",
  testimonials: "testimonials",
  faqs: "faqs",
  menus: "menus",
  media: "media",
  mediaFolders: "mediaFolders",
  gallery: "gallery",

  // system
  notifications: "notifications",
  whatsappTemplates: "whatsappTemplates",
  auditLogs: "auditLogs",
  counters: "counters",
} as const;

export type CollectionName = (typeof C)[keyof typeof C];

/** The single settings document id. */
export const SETTINGS_DOC_ID = "clinic";
export const DEFAULT_BRANCH_ID = "islamabad-f11";

/**
 * Collections that are world-readable (the public website reads them without
 * auth). Everything not listed here is denied to anonymous users by the rules.
 */
export const PUBLIC_READ_COLLECTIONS: CollectionName[] = [
  C.services,
  C.serviceCategories,
  C.packages,
  C.doctors,
  C.pages,
  C.blogs,
  C.testimonials,
  C.faqs,
  C.menus,
  C.gallery,
  C.settings,
  C.branches,
];
