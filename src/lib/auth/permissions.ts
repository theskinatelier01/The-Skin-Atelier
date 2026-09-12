/**
 * Role-based access control.
 *
 * This module is the single source of truth for authorisation and is imported
 * by both the client (to hide UI) and the server (to actually enforce).
 * Hiding a button is never the control - every server action calls
 * `requirePermission`, and Firestore rules re-check the same role claims.
 */

export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "DOCTOR",
  "FRONT_DESK",
  "RECEPTIONIST",
  "INVENTORY_MANAGER",
  "ACCOUNTANT",
  "MARKETING_MANAGER",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  FRONT_DESK: "Front Desk",
  RECEPTIONIST: "Receptionist",
  INVENTORY_MANAGER: "Inventory Manager",
  ACCOUNTANT: "Accountant",
  MARKETING_MANAGER: "Marketing Manager",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN: "Unrestricted access, including user and role management.",
  ADMIN: "Full clinic and website access. Cannot manage roles or system settings.",
  DOCTOR: "Clinical records, consultations, treatments and own schedule.",
  FRONT_DESK: "Reception desk: patients, appointments, queue, billing.",
  RECEPTIONIST: "Appointment handling and patient lookup.",
  INVENTORY_MANAGER: "Stock, batches, suppliers and purchase orders.",
  ACCOUNTANT: "Invoices, payments, expenses and financial reporting.",
  MARKETING_MANAGER: "Website CMS, blog, leads and campaign content.",
};

/* ------------------------------------------------------------------------ */
/* Permissions                                                               */
/* ------------------------------------------------------------------------ */

/**
 * Format: `<module>.<action>`.
 * `*` is only ever granted to SUPER_ADMIN and is expanded in `hasPermission`.
 */
export const PERMISSIONS = {
  // --- Website / CMS ------------------------------------------------------
  "cms.pages.read": "View website pages",
  "cms.pages.write": "Create and edit website pages",
  "cms.pages.publish": "Publish or unpublish pages",
  "cms.media.read": "View media library",
  "cms.media.write": "Upload and manage media",
  "cms.media.delete": "Delete media files",
  "cms.blog.read": "View blog posts",
  "cms.blog.write": "Write and edit blog posts",
  "cms.blog.publish": "Publish blog posts",
  "cms.services.read": "View service catalogue",
  "cms.services.write": "Edit service catalogue",
  "cms.testimonials.write": "Manage testimonials",
  "cms.faqs.write": "Manage FAQs",
  "cms.menus.write": "Manage navigation menus",
  "cms.seo.write": "Manage SEO settings",
  "cms.beforeAfter.read": "View before and after cases",
  "cms.beforeAfter.approve": "Approve cases for publication",
  "cms.settings.write": "Edit website settings",

  // --- Clinic operations --------------------------------------------------
  "patients.read": "View patient directory",
  "patients.write": "Create and edit patients",
  "patients.delete": "Archive patients",
  "patients.medical.read": "View medical and clinical records",
  "patients.medical.write": "Edit medical and clinical records",
  "appointments.read": "View appointments",
  "appointments.write": "Book and edit appointments",
  "appointments.cancel": "Cancel appointments",
  "queue.manage": "Manage the waiting queue",
  "consultations.read": "View consultations",
  "consultations.write": "Record consultations",
  "treatments.read": "View treatment records",
  "treatments.write": "Record treatments",
  "leads.read": "View leads",
  "leads.write": "Manage leads",

  // --- Sales and finance --------------------------------------------------
  "pos.use": "Use point of sale",
  "invoices.read": "View invoices",
  "invoices.write": "Create and edit invoices",
  "invoices.void": "Void or refund invoices",
  "payments.read": "View payments",
  "payments.write": "Record payments",
  "expenses.read": "View expenses",
  "expenses.write": "Record expenses",
  "finance.reports": "View financial reports",
  "packages.read": "View packages",
  "packages.write": "Manage packages and memberships",

  // --- Inventory ----------------------------------------------------------
  "inventory.read": "View inventory",
  "inventory.write": "Adjust stock",
  "inventory.batches.write": "Manage batches and expiry",
  "suppliers.read": "View suppliers",
  "suppliers.write": "Manage suppliers",
  "purchaseOrders.read": "View purchase orders",
  "purchaseOrders.write": "Create purchase orders",
  "purchaseOrders.approve": "Approve purchase orders",

  // --- People -------------------------------------------------------------
  "staff.read": "View staff",
  "staff.write": "Manage staff",
  "doctors.write": "Manage doctor profiles",
  "schedules.write": "Manage schedules and leave",

  // --- System -------------------------------------------------------------
  "users.read": "View system users",
  "users.write": "Create and edit users",
  "roles.write": "Assign roles and permissions",
  "auditLogs.read": "View audit logs",
  "settings.write": "Edit clinic settings",
  "notifications.read": "View notifications",
  "reports.export": "Export reports",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

/* ------------------------------------------------------------------------ */
/* Role -> permission matrix                                                 */
/* ------------------------------------------------------------------------ */

const FRONT_DESK_PERMISSIONS: Permission[] = [
  // Reception is deliberately broad on operations and empty on CMS, inventory
  // purchasing, financial reporting and staff management.
  "patients.read",
  "patients.write",
  "appointments.read",
  "appointments.write",
  "appointments.cancel",
  "queue.manage",
  "consultations.read",
  "treatments.read",
  "leads.read",
  "leads.write",
  "pos.use",
  "invoices.read",
  "invoices.write",
  "payments.read",
  "payments.write",
  "packages.read",
  "notifications.read",
  "cms.services.read",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[] | ["*"]> = {
  SUPER_ADMIN: ["*"],

  ADMIN: ALL_PERMISSIONS.filter(
    (p) => !(["roles.write", "users.write", "settings.write"] as string[]).includes(p),
  ),

  DOCTOR: [
    "patients.read",
    "patients.medical.read",
    "patients.medical.write",
    "appointments.read",
    "appointments.write",
    "queue.manage",
    "consultations.read",
    "consultations.write",
    "treatments.read",
    "treatments.write",
    "cms.beforeAfter.read",
    "cms.services.read",
    "packages.read",
    "inventory.read",
    "notifications.read",
  ],

  FRONT_DESK: FRONT_DESK_PERMISSIONS,

  // A receptionist is a narrower front desk: no billing authority.
  RECEPTIONIST: FRONT_DESK_PERMISSIONS.filter(
    (p) => !(["pos.use", "invoices.write", "payments.write"] as string[]).includes(p),
  ),

  INVENTORY_MANAGER: [
    "inventory.read",
    "inventory.write",
    "inventory.batches.write",
    "suppliers.read",
    "suppliers.write",
    "purchaseOrders.read",
    "purchaseOrders.write",
    "expenses.read",
    "notifications.read",
    "reports.export",
  ],

  ACCOUNTANT: [
    "invoices.read",
    "invoices.write",
    "invoices.void",
    "payments.read",
    "payments.write",
    "expenses.read",
    "expenses.write",
    "finance.reports",
    "reports.export",
    "patients.read",
    "packages.read",
    "purchaseOrders.read",
    "inventory.read",
    "notifications.read",
  ],

  MARKETING_MANAGER: [
    "cms.pages.read",
    "cms.pages.write",
    "cms.pages.publish",
    "cms.media.read",
    "cms.media.write",
    "cms.blog.read",
    "cms.blog.write",
    "cms.blog.publish",
    "cms.services.read",
    "cms.services.write",
    "cms.testimonials.write",
    "cms.faqs.write",
    "cms.menus.write",
    "cms.seo.write",
    "cms.beforeAfter.read",
    "cms.settings.write",
    "leads.read",
    "leads.write",
    "notifications.read",
    "reports.export",
  ],
};

/* ------------------------------------------------------------------------ */
/* Checks                                                                    */
/* ------------------------------------------------------------------------ */

export interface AuthContext {
  uid: string;
  email: string | null;
  role: Role;
  /** Per-user grants layered on top of the role matrix. */
  extraPermissions?: Permission[];
  /** Per-user revocations, applied last. */
  deniedPermissions?: Permission[];
  branchIds?: string[];
  disabled?: boolean;
}

export function permissionsForRole(role: Role): Permission[] {
  const granted = ROLE_PERMISSIONS[role];
  if (granted[0] === "*") return ALL_PERMISSIONS;
  return granted as Permission[];
}

export function resolvePermissions(ctx: Pick<AuthContext, "role" | "extraPermissions" | "deniedPermissions">): Set<Permission> {
  const set = new Set<Permission>(permissionsForRole(ctx.role));
  for (const p of ctx.extraPermissions ?? []) set.add(p);
  for (const p of ctx.deniedPermissions ?? []) set.delete(p);
  return set;
}

export function hasPermission(
  ctx: Pick<AuthContext, "role" | "extraPermissions" | "deniedPermissions"> | null | undefined,
  permission: Permission,
): boolean {
  if (!ctx) return false;
  // Denials win even for a super admin, so a break-glass revocation works.
  if (ctx.deniedPermissions?.includes(permission)) return false;
  if (ctx.role === "SUPER_ADMIN") return true;
  if (ctx.extraPermissions?.includes(permission)) return true;
  return (ROLE_PERMISSIONS[ctx.role] as string[]).includes(permission);
}

export function hasAnyPermission(
  ctx: Pick<AuthContext, "role" | "extraPermissions" | "deniedPermissions"> | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(ctx, p));
}

/** Thrown by `requirePermission`; mapped to a 403 by callers. */
export class PermissionError extends Error {
  readonly code = "permission-denied";
  constructor(public readonly permission: Permission) {
    super(`Missing required permission: ${permission}`);
    this.name = "PermissionError";
  }
}
