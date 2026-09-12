import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Badge, type Tone } from "@/components/ui/primitives";
import {
  type AppointmentStatus,
  type InvoiceStatus,
  type LeadStage,
  type PurchaseOrderStatus,
  type QueueStatus,
} from "@/types";

/* -------------------------------------------------------------------------- */
/* Page chrome                                                                 */
/* -------------------------------------------------------------------------- */

export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumb,
  domain,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  /** Tints the eyebrow so the two halves of the product stay distinguishable. */
  domain?: "website" | "clinic";
}) {
  return (
    <header className="mb-7">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2.5">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-subtle">
            {breadcrumb.map((crumb, i) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-ink">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {domain && (
            <p
              className={cn(
                "text-[0.625rem] font-semibold uppercase tracking-[0.18em]",
                domain === "website" ? "text-champagne-500" : "text-ink-subtle",
              )}
            >
              {domain === "website" ? "Website" : "Clinic"}
            </p>
          )}
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Statistics                                                                  */
/* -------------------------------------------------------------------------- */

export function StatCard({
  label,
  value,
  hint,
  trend,
  tone = "neutral",
  href,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Percentage change against the comparison period. */
  trend?: number;
  tone?: "neutral" | "positive" | "warning" | "critical";
  href?: string;
  icon?: ReactNode;
}) {
  const toneRing = {
    neutral: "border-line-subtle",
    positive: "border-success/25",
    warning: "border-warning/30",
    critical: "border-danger/30",
  }[tone];

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-ink-subtle">
          {label}
        </p>
        {icon && (
          <span aria-hidden="true" className="shrink-0 text-ink-subtle [&>svg]:size-4">
            {icon}
          </span>
        )}
      </div>

      <p className="mt-3 font-display text-[1.75rem] leading-none tabular-nums text-ink">{value}</p>

      <div className="mt-2.5 flex items-center gap-2">
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
              trend >= 0 ? "text-success" : "text-danger",
            )}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="size-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3" aria-hidden="true" />
            )}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
        {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
      </div>
    </>
  );

  const className = cn(
    "block rounded-md border bg-canvas-raised p-5 transition-shadow duration-200",
    toneRing,
    href && "hover:shadow-card",
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status badges                                                               */
/* -------------------------------------------------------------------------- */

const APPOINTMENT_TONES: Record<AppointmentStatus, Tone> = {
  Booked: "neutral",
  Confirmed: "info",
  Arrived: "accent",
  "In Consultation": "accent",
  Treatment: "accent",
  Completed: "success",
  Cancelled: "neutral",
  "No Show": "danger",
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge tone={APPOINTMENT_TONES[status] ?? "neutral"} dot>
      {status}
    </Badge>
  );
}

const INVOICE_TONES: Record<InvoiceStatus, Tone> = {
  Paid: "success",
  "Partially Paid": "warning",
  Unpaid: "danger",
  Refunded: "info",
  Void: "neutral",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={INVOICE_TONES[status] ?? "neutral"}>{status}</Badge>;
}

const QUEUE_TONES: Record<QueueStatus, Tone> = {
  WAITING: "warning",
  CALLED: "info",
  "WITH DOCTOR": "accent",
  TREATMENT: "accent",
  COMPLETED: "success",
};

export function QueueStatusBadge({ status }: { status: QueueStatus }) {
  return (
    <Badge tone={QUEUE_TONES[status] ?? "neutral"} dot>
      {status}
    </Badge>
  );
}

const LEAD_TONES: Record<LeadStage, Tone> = {
  NEW: "info",
  CONTACTED: "neutral",
  "CONSULTATION BOOKED": "accent",
  "CONSULTATION COMPLETED": "accent",
  CONVERTED: "success",
  LOST: "danger",
};

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return <Badge tone={LEAD_TONES[stage] ?? "neutral"}>{stage}</Badge>;
}

const PO_TONES: Record<PurchaseOrderStatus, Tone> = {
  Draft: "neutral",
  Ordered: "info",
  "Partially Received": "warning",
  Received: "success",
  Cancelled: "danger",
};

export function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return <Badge tone={PO_TONES[status] ?? "neutral"}>{status}</Badge>;
}

/* -------------------------------------------------------------------------- */
/* Section                                                                     */
/* -------------------------------------------------------------------------- */

export function AdminSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-line-subtle bg-canvas-raised", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line-subtle px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink-subtle">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}
