import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/** Pakistani Rupee by default; the symbol comes from clinic settings. */
export function formatCurrency(
  amount: number | null | undefined,
  symbol = "PKR",
  options: { compact?: boolean } = {},
): string {
  if (amount === null || amount === undefined) return "—";
  if (options.compact && Math.abs(amount) >= 1000) {
    const units: [number, string][] = [
      [1_000_000_000, "B"],
      [1_000_000, "M"],
      [1_000, "K"],
    ];
    for (const [size, suffix] of units) {
      if (Math.abs(amount) >= size) {
        const v = amount / size;
        return `${symbol} ${v.toFixed(v < 10 ? 1 : 0)}${suffix}`;
      }
    }
  }
  return `${symbol} ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount)}`;
}

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : parseISO(value);
  return isValid(d) ? d : null;
}

export function formatDate(value: string | Date | null | undefined, pattern = "d MMM yyyy") {
  const d = toDate(value);
  return d ? format(d, pattern) : "—";
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, "d MMM yyyy, h:mm a");
}

export function formatRelative(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

/** `14:30` -> `2:30 PM`. Appointment times are stored as 24h strings. */
export function formatTime(hhmm: string | undefined | null): string {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

/** Minutes since midnight - used for calendar layout maths. */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutesToTime(hhmm: string, minutes: number): string {
  return minutesToTime(timeToMinutes(hhmm) + minutes);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** `Aisha Khan` -> `A. K.` for anonymous public display. */
export function anonymiseName(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => `${p[0]?.toUpperCase()}.`)
      .join(" ") || "Anonymous"
  );
}

export function formatPhoneForWhatsApp(phone: string, countryCode = "92"): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith(countryCode)) return digits;
  return countryCode + digits.replace(/^0+/, "");
}

export function whatsappLink(phone: string, message?: string): string {
  const base = `https://wa.me/${formatPhoneForWhatsApp(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Fills `{{placeholders}}` in a WhatsApp/notification template. */
export function renderTemplate(body: string, vars: Record<string, string | number>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** `yyyy-MM-dd` in clinic-local time, the key format used by appointments. */
export function dateKey(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}
