import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  children,
  as: Tag = "div",
  interactive,
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "article" | "section" | "li";
  interactive?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "rounded-md border border-line-subtle bg-canvas-raised",
        interactive &&
          "transition-shadow duration-300 ease-editorial hover:shadow-lifted hover:border-line",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-line-subtle px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="font-sans text-sm font-semibold tracking-[0.01em] text-ink">{title}</h3>
        {description && <p className="mt-0.5 text-[0.8125rem] text-ink-subtle">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Editorial section heading (public site)                                     */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="eyebrow flex items-center gap-3">
          {align === "center" && <span className="rule-gold hidden sm:block" aria-hidden="true" />}
          {eyebrow}
          <span className="rule-gold" aria-hidden="true" />
        </p>
      )}
      <Tag className={cn("mt-5 text-display-md font-display", align === "center" && "text-balance")}>
        {title}
      </Tag>
      {description && (
        <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-muted">{description}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                      */
/* -------------------------------------------------------------------------- */

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-canvas-sunken text-ink-muted border-line-subtle",
  success: "bg-success-bg text-success border-success/20",
  warning: "bg-warning-bg text-warning border-warning/20",
  danger: "bg-danger-bg text-danger border-danger/20",
  info: "bg-info-bg text-info border-info/20",
  accent: "bg-ivory-300 text-gold-700 border-champagne-300",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5",
        "text-[0.6875rem] font-medium uppercase tracking-[0.08em] whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {/* The dot is redundant with the label, so it stays decorative — status is
          never conveyed by colour alone. */}
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty / loading states                                                      */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      {icon && (
        <div
          aria-hidden="true"
          className="mb-5 grid size-12 place-items-center rounded-full border border-line-subtle bg-canvas-sunken text-ink-subtle [&>svg]:size-5"
        >
          {icon}
        </div>
      )}
      <p className="font-display text-lg text-ink">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-ink-subtle">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("shimmer rounded-xs", className)} />;
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                        */
/* -------------------------------------------------------------------------- */

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line-subtle", className)} />;
}

/** Small label/value pair used across patient and invoice detail panes. */
export function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2", className)}>
      <dt className="shrink-0 text-[0.8125rem] text-ink-subtle">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{value ?? "—"}</dd>
    </div>
  );
}
