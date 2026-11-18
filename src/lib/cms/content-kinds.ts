/**
 * Website content editors.
 *
 * One description per editable collection drives both the admin form (which
 * fields to render, with what labels) and the list view. The server action in
 * `server/actions/content.ts` reads the same field names back out of the form,
 * so adding a field here and to the schema is all a new input needs.
 *
 * This module is imported by client components, so it must stay free of
 * server-only code.
 */

import type { Permission } from "@/lib/auth/permissions";

export const CONTENT_KINDS = ["doctors", "packages", "gallery", "testimonials", "faqs", "blog"] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "image"
  | "lines"
  | "date"
  | "datetime";

export interface FieldDef {
  /** Dot paths ("seo.title") are read from and written to nested objects. */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  description?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  maxLength?: number;
  /** Spans both columns of the form grid. */
  full?: boolean;
  /** For slug fields: the field the URL is generated from while untouched. */
  slugFrom?: string;
  /** Text shown before the input, e.g. "/doctors/". */
  leading?: string;
  /** Default for a new record. */
  defaultValue?: string | number | boolean;
}

export interface KindDef {
  label: string;
  singular: string;
  /** Needed to open the screen. */
  readPermission: Permission;
  /** Needed to add, edit or delete. */
  writePermission: Permission;
  /** Field used as the row title in the list. */
  titleField: string;
  imageField?: string;
  /** Boolean field that decides whether the item is live on the site. */
  liveField?: string;
  /** Where the item appears publicly, shown to the editor. */
  publicPath: (item: Record<string, unknown>) => string;
  subtitle: (item: Record<string, unknown>) => string;
  fields: FieldDef[];
}

const seoFields: FieldDef[] = [
  {
    name: "seo.title",
    label: "SEO title",
    type: "text",
    maxLength: 70,
    hint: "Up to 70 characters. Leave blank to use the name.",
  },
  {
    name: "seo.description",
    label: "SEO description",
    type: "textarea",
    rows: 2,
    maxLength: 180,
    hint: "Up to 180 characters. Shown under the link in Google.",
  },
];

const order: FieldDef = {
  name: "displayOrder",
  label: "Display order",
  type: "number",
  hint: "Lower numbers appear first",
  defaultValue: 0,
};

export const KINDS: Record<ContentKind, KindDef> = {
  doctors: {
    label: "Doctors",
    singular: "doctor",
    readPermission: "cms.services.read",
    writePermission: "cms.pages.write",
    titleField: "fullName",
    imageField: "photoUrl",
    liveField: "isPublished",
    publicPath: (d) => `/doctors/${d.slug}`,
    subtitle: (d) => String(d.title ?? ""),
    fields: [
      { name: "fullName", label: "Full name", type: "text", required: true },
      { name: "slug", label: "URL", type: "text", required: true, slugFrom: "fullName", leading: "/doctors/" },
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Aesthetic Physician" },
      order,
      { name: "photoUrl", label: "Portrait", type: "image", full: true, hint: "A portrait crop works best (4:5)." },
      { name: "bio", label: "Biography", type: "textarea", rows: 6, required: true, full: true, hint: "Separate paragraphs with a blank line." },
      { name: "qualifications", label: "Qualifications", type: "lines", rows: 4, hint: "One per line" },
      { name: "specialties", label: "Specialties", type: "lines", rows: 4, hint: "One per line" },
      { name: "languages", label: "Languages", type: "lines", rows: 3, hint: "One per line" },
      { name: "yearsExperience", label: "Years of experience", type: "number" },
      { name: "consultationFee", label: "Consultation fee", type: "number" },
      { name: "isPublished", label: "Published on the website", type: "checkbox", defaultValue: true, full: true },
      ...seoFields,
    ],
  },
  packages: {
    label: "Packages",
    singular: "package",
    readPermission: "packages.read",
    writePermission: "cms.services.write",
    titleField: "name",
    imageField: "coverImageUrl",
    liveField: "isActive",
    publicPath: () => "/packages",
    subtitle: (p) => `${p.totalSessions ?? 0} sessions · ${p.price ?? 0}`,
    fields: [
      { name: "name", label: "Package name", type: "text", required: true },
      { name: "slug", label: "Identifier", type: "text", required: true, slugFrom: "name" },
      { name: "price", label: "Price", type: "number", required: true },
      { name: "compareAtPrice", label: "Price before discount", type: "number", hint: "Shown struck through. Optional." },
      { name: "validityDays", label: "Valid for (days)", type: "number", required: true, defaultValue: 180 },
      order,
      { name: "description", label: "Description", type: "textarea", rows: 4, required: true, full: true },
      {
        name: "items",
        label: "Treatments included",
        type: "lines",
        rows: 4,
        required: true,
        full: true,
        hint: "One per line with the number of sessions after a pipe, e.g. HydraFacial | 3",
      },
      { name: "coverImageUrl", label: "Cover image", type: "image", full: true },
      { name: "terms", label: "Terms", type: "textarea", rows: 3, full: true },
      { name: "isActive", label: "Available on the website", type: "checkbox", defaultValue: true },
      { name: "isFeatured", label: "Feature on the homepage", type: "checkbox" },
    ],
  },
  gallery: {
    label: "Gallery",
    singular: "image",
    readPermission: "cms.media.read",
    writePermission: "cms.media.write",
    titleField: "altText",
    imageField: "imageUrl",
    liveField: "isVisible",
    publicPath: () => "/gallery",
    subtitle: (g) => [g.category, g.isSocial ? "Homepage social rail" : ""].filter(Boolean).join(" · "),
    fields: [
      { name: "imageUrl", label: "Image", type: "image", required: true, full: true },
      { name: "altText", label: "Alt text", type: "text", required: true, full: true, hint: "Describe what is in the photo. Used by screen readers and Google Images." },
      { name: "caption", label: "Caption", type: "text" },
      { name: "category", label: "Category", type: "text", placeholder: "Clinic" },
      { name: "linkUrl", label: "Link", type: "text", placeholder: "https://www.instagram.com/p/…", hint: "Optional. Where a click on the image goes." },
      order,
      { name: "isVisible", label: "Visible on the website", type: "checkbox", defaultValue: true },
      { name: "isSocial", label: "Show in the homepage social rail", type: "checkbox" },
    ],
  },
  testimonials: {
    label: "Testimonials",
    singular: "testimonial",
    readPermission: "cms.testimonials.write",
    writePermission: "cms.testimonials.write",
    titleField: "authorName",
    imageField: "avatarUrl",
    liveField: "isVisible",
    publicPath: () => "/",
    subtitle: (t) => `${t.rating ?? 5}★ · ${t.source ?? ""}${t.serviceName ? ` · ${t.serviceName}` : ""}`,
    fields: [
      { name: "authorName", label: "Patient name", type: "text", required: true, hint: "First name and initial is usually enough." },
      {
        name: "rating",
        label: "Rating",
        type: "select",
        required: true,
        defaultValue: "5",
        options: ["5", "4", "3", "2", "1"].map((v) => ({ value: v, label: `${v} stars` })),
      },
      { name: "body", label: "Review", type: "textarea", rows: 5, required: true, full: true },
      { name: "serviceName", label: "Treatment", type: "text" },
      { name: "occasion", label: "Occasion", type: "text", placeholder: "Pre-Wedding Glow" },
      {
        name: "source",
        label: "Source",
        type: "select",
        required: true,
        defaultValue: "Google",
        options: ["Google", "Instagram", "In-clinic", "Facebook", "Other"].map((v) => ({ value: v, label: v })),
      },
      { name: "date", label: "Date", type: "date" },
      order,
      { name: "avatarUrl", label: "Photo", type: "image", full: true, hint: "Optional. Only with the patient's permission." },
      { name: "isVisible", label: "Visible on the website", type: "checkbox", defaultValue: true, full: true },
    ],
  },
  faqs: {
    label: "FAQ",
    singular: "question",
    readPermission: "cms.faqs.write",
    writePermission: "cms.faqs.write",
    titleField: "question",
    liveField: "isVisible",
    publicPath: () => "/faq",
    subtitle: (f) => String(f.category ?? "General"),
    fields: [
      { name: "question", label: "Question", type: "text", required: true, full: true },
      { name: "answer", label: "Answer", type: "textarea", rows: 6, required: true, full: true },
      { name: "category", label: "Category", type: "text", defaultValue: "General" },
      order,
      { name: "isVisible", label: "Visible on the website", type: "checkbox", defaultValue: true },
      { name: "showOnFaqPage", label: "Show on the FAQ page", type: "checkbox", defaultValue: true },
    ],
  },
  blog: {
    label: "Blog",
    singular: "post",
    readPermission: "cms.blog.read",
    writePermission: "cms.blog.write",
    titleField: "title",
    imageField: "coverImageUrl",
    publicPath: (p) => `/blog/${p.slug}`,
    subtitle: (p) => `${String(p.status ?? "draft")}${p.authorName ? ` · ${p.authorName}` : ""}`,
    fields: [
      { name: "title", label: "Title", type: "text", required: true, full: true },
      { name: "slug", label: "URL", type: "text", required: true, slugFrom: "title", leading: "/blog/" },
      { name: "authorName", label: "Author", type: "text", required: true },
      { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, required: true, full: true, hint: "One or two sentences shown on the blog list." },
      {
        name: "body",
        label: "Article",
        type: "textarea",
        rows: 14,
        required: true,
        full: true,
        hint: "Separate paragraphs with a blank line. Start a line with ## for a heading.",
      },
      { name: "coverImageUrl", label: "Cover image", type: "image", full: true },
      { name: "categories", label: "Categories", type: "lines", rows: 2, hint: "One per line" },
      { name: "tags", label: "Tags", type: "lines", rows: 2, hint: "One per line" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        defaultValue: "draft",
        options: [
          { value: "draft", label: "Draft (not on the website)" },
          { value: "published", label: "Published now" },
          { value: "scheduled", label: "Scheduled" },
        ],
      },
      { name: "scheduledFor", label: "Publish at", type: "datetime", hint: "Only used when the status is Scheduled." },
      ...seoFields,
    ],
  },
};

/** Reads a dot path ("seo.title") from a record. */
export function getPath(item: Record<string, unknown> | undefined, path: string): unknown {
  if (!item) return undefined;
  return path.split(".").reduce<unknown>(
    (value, key) => (value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined),
    item,
  );
}
