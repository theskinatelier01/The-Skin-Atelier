import type { Permission } from "@/lib/auth/permissions";

/**
 * Admin navigation.
 *
 * Each item declares the permissions that reveal it. The sidebar renders only
 * what the signed-in user can actually reach, so a front desk account sees a
 * reception system rather than a disabled enterprise menu. Hiding is cosmetic —
 * every destination re-checks on the server.
 */

export interface NavItem {
  label: string;
  href: string;
  /** Item is shown when the user holds ANY of these. */
  permissions: Permission[];
  /** Shown as a live count badge, resolved by the layout. */
  badgeKey?: "requests" | "queue" | "lowStock" | "unpaid" | "consent";
}

export interface NavGroup {
  id: string;
  title: string;
  /** Distinguishes the two halves of the product in the sidebar. */
  domain: "overview" | "website" | "clinic" | "inventory" | "finance" | "people" | "system";
  description?: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    id: "overview",
    title: "Overview",
    domain: "overview",
    items: [{ label: "Dashboard", href: "/admin", permissions: [] }],
  },

  {
    id: "website",
    title: "Website",
    domain: "website",
    description: "Everything the public sees",
    items: [
      { label: "Pages", href: "/admin/website/pages", permissions: ["cms.pages.read"] },
      { label: "Services", href: "/admin/website/services", permissions: ["cms.services.read"] },
      { label: "Doctors", href: "/admin/website/doctors", permissions: ["doctors.write", "cms.pages.read"] },
      { label: "Packages", href: "/admin/website/packages", permissions: ["packages.read"] },
      { label: "Gallery", href: "/admin/website/gallery", permissions: ["cms.media.read"] },
      {
        label: "Before & After",
        href: "/admin/website/before-after",
        permissions: ["cms.beforeAfter.read"],
        badgeKey: "consent",
      },
      { label: "Testimonials", href: "/admin/website/testimonials", permissions: ["cms.testimonials.write"] },
      { label: "Blog", href: "/admin/website/blog", permissions: ["cms.blog.read"] },
      { label: "FAQ", href: "/admin/website/faq", permissions: ["cms.faqs.write"] },
      { label: "Media Library", href: "/admin/website/media", permissions: ["cms.media.read"] },
      { label: "Menus", href: "/admin/website/menus", permissions: ["cms.menus.write"] },
      { label: "SEO", href: "/admin/website/seo", permissions: ["cms.seo.write"] },
      { label: "Website Settings", href: "/admin/website/settings", permissions: ["cms.settings.write"] },
    ],
  },

  {
    id: "clinic",
    title: "Clinic",
    domain: "clinic",
    description: "Day-to-day operations",
    items: [
      { label: "Front Desk", href: "/admin/clinic/front-desk", permissions: ["appointments.read"] },
      {
        label: "Booking Requests",
        href: "/admin/clinic/requests",
        permissions: ["appointments.write"],
        badgeKey: "requests",
      },
      { label: "Appointments", href: "/admin/clinic/appointments", permissions: ["appointments.read"] },
      { label: "Calendar", href: "/admin/clinic/calendar", permissions: ["appointments.read"] },
      { label: "Patients", href: "/admin/clinic/patients", permissions: ["patients.read"] },
      { label: "Leads", href: "/admin/clinic/leads", permissions: ["leads.read"] },
      { label: "Consultations", href: "/admin/clinic/consultations", permissions: ["consultations.read"] },
      { label: "Treatments", href: "/admin/clinic/treatments", permissions: ["treatments.read"] },
      {
        label: "Waiting Queue",
        href: "/admin/clinic/queue",
        permissions: ["queue.manage"],
        badgeKey: "queue",
      },
      { label: "Patient Packages", href: "/admin/clinic/packages", permissions: ["packages.read"] },
      { label: "Point of Sale", href: "/admin/clinic/pos", permissions: ["pos.use"] },
      {
        label: "Invoices",
        href: "/admin/clinic/invoices",
        permissions: ["invoices.read"],
        badgeKey: "unpaid",
      },
      { label: "Payments", href: "/admin/clinic/payments", permissions: ["payments.read"] },
    ],
  },

  {
    id: "inventory",
    title: "Inventory",
    domain: "inventory",
    description: "Stock, batches and suppliers",
    items: [
      {
        label: "Products",
        href: "/admin/inventory/products",
        permissions: ["inventory.read"],
        badgeKey: "lowStock",
      },
      { label: "Stock Movements", href: "/admin/inventory/movements", permissions: ["inventory.read"] },
      { label: "Batches", href: "/admin/inventory/batches", permissions: ["inventory.read"] },
      { label: "Expiry", href: "/admin/inventory/expiry", permissions: ["inventory.read"] },
      { label: "Suppliers", href: "/admin/inventory/suppliers", permissions: ["suppliers.read"] },
      {
        label: "Purchase Orders",
        href: "/admin/inventory/purchase-orders",
        permissions: ["purchaseOrders.read"],
      },
    ],
  },

  {
    id: "finance",
    title: "Finance",
    domain: "finance",
    items: [
      { label: "Revenue", href: "/admin/finance/revenue", permissions: ["finance.reports"] },
      { label: "Expenses", href: "/admin/finance/expenses", permissions: ["expenses.read"] },
      { label: "Reports", href: "/admin/finance/reports", permissions: ["finance.reports", "reports.export"] },
    ],
  },

  {
    id: "people",
    title: "Staff",
    domain: "people",
    items: [
      { label: "Staff", href: "/admin/staff", permissions: ["staff.read"] },
      { label: "Doctors", href: "/admin/staff/doctors", permissions: ["doctors.write"] },
      { label: "Schedules", href: "/admin/staff/schedules", permissions: ["schedules.write"] },
    ],
  },

  {
    id: "system",
    title: "System",
    domain: "system",
    items: [
      { label: "Users", href: "/admin/system/users", permissions: ["users.read"] },
      { label: "Roles & Permissions", href: "/admin/system/roles", permissions: ["roles.write"] },
      { label: "Notifications", href: "/admin/system/notifications", permissions: ["notifications.read"] },
      { label: "Audit Logs", href: "/admin/system/audit", permissions: ["auditLogs.read"] },
      { label: "Clinic Settings", href: "/admin/system/settings", permissions: ["settings.write"] },
    ],
  },
];

/** Accent colour per domain, used for the sidebar rail and group label. */
export const DOMAIN_ACCENT: Record<NavGroup["domain"], string> = {
  overview: "text-ivory-100/60",
  website: "text-champagne-400",
  clinic: "text-ivory-100/85",
  inventory: "text-ivory-100/60",
  finance: "text-ivory-100/60",
  people: "text-ivory-100/60",
  system: "text-ivory-100/60",
};
