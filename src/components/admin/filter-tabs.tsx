import Link from "next/link";

import { cn } from "@/lib/utils/cn";

/**
 * Status filter chips.
 *
 * Server-rendered links rather than client state, so filtering is a normal
 * navigation that can be bookmarked and shared with a colleague.
 */
export function FilterTabs({
  basePath,
  param,
  current,
  options,
  allLabel = "All",
}: {
  basePath: string;
  param: string;
  current?: string;
  options: string[];
  allLabel?: string;
}) {
  return (
    <nav aria-label="Filter" className="rail-scroll -mx-1 flex gap-1 overflow-x-auto px-1">
      <Chip href={basePath} active={!current}>
        {allLabel}
      </Chip>
      {options.map((option) => (
        <Chip
          key={option}
          href={`${basePath}?${param}=${encodeURIComponent(option)}`}
          active={current === option}
        >
          {option}
        </Chip>
      ))}
    </nav>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "whitespace-nowrap rounded-sm border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-ink bg-primary text-on-primary"
          : "border-line bg-canvas-raised text-ink-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
