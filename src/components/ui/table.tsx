import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Table primitives.
 *
 * The wrapper is the only element allowed to scroll horizontally — the page
 * body never does. On narrow screens the caller can switch to a card list
 * instead; see `MobileRowCard`.
 */

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("w-full overflow-x-auto rounded-md border border-line-subtle bg-canvas-raised", className)}
      // Keyboard users must be able to scroll the region, so it is focusable.
      tabIndex={0}
      role="region"
      aria-label="Scrollable table"
    >
      {children}
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn("w-full border-collapse text-sm", className)}>{children}</table>;
}

export function Th({
  children,
  className,
  align = "left",
  scope = "col",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  scope?: "col" | "row";
}) {
  return (
    <th
      scope={scope}
      className={cn(
        "sticky top-0 z-10 whitespace-nowrap border-b border-line bg-canvas-sunken px-4 py-3",
        "text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-ink-muted",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border-b border-line-subtle px-4 py-3 align-middle text-ink",
        align === "right" && "text-right tabular-nums",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition-colors duration-150 hover:bg-canvas-sunken/60 last:[&>td]:border-b-0",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

/** Stacked presentation of one record, used below the `md` breakpoint. */
export function MobileRowCard({
  title,
  subtitle,
  meta,
  actions,
  onClick,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2 border-b border-line-subtle px-4 py-4 last:border-b-0",
        onClick && "cursor-pointer active:bg-canvas-sunken",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{title}</p>
          {subtitle && <p className="mt-0.5 truncate text-[0.8125rem] text-ink-subtle">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {meta && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
    </div>
  );
}
