import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { dateKey } from "@/lib/utils/format";

/**
 * Date range presets.
 *
 * Plain links rather than a client component — the page is server-rendered per
 * range, so there is no state to hold and no JavaScript to ship.
 */
export function DateRangeTabs({
  basePath,
  from,
  to,
  extraParams,
}: {
  basePath: string;
  from: string;
  to: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const today = new Date();
  const day = 86_400_000;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const ranges = [
    { label: "Today", from: dateKey(today), to: dateKey(today) },
    { label: "Tomorrow", from: dateKey(new Date(+today + day)), to: dateKey(new Date(+today + day)) },
    { label: "Next 7 days", from: dateKey(today), to: dateKey(new Date(+today + 7 * day)) },
    { label: "This week", from: dateKey(startOfWeek), to: dateKey(new Date(+startOfWeek + 6 * day)) },
    { label: "This month", from: dateKey(startOfMonth), to: dateKey(endOfMonth) },
    { label: "Past 30 days", from: dateKey(new Date(+today - 30 * day)), to: dateKey(today) },
  ];

  function href(range: { from: string; to: string }) {
    const params = new URLSearchParams({ from: range.from, to: range.to });
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) params.set(key, value);
    }
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav aria-label="Date range" className="rail-scroll -mx-1 flex gap-1 overflow-x-auto px-1">
      {ranges.map((range) => {
        const active = range.from === from && range.to === to;
        return (
          <Link
            key={range.label}
            href={href(range)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "whitespace-nowrap rounded-sm border px-3 py-1.5 text-xs transition-colors",
              active
                ? "border-ink bg-primary text-on-primary"
                : "border-line bg-canvas-raised text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {range.label}
          </Link>
        );
      })}
    </nav>
  );
}
