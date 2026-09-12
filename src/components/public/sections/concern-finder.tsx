"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { SKIN_CONCERNS } from "@/types";
import type { Service } from "@/types";

/**
 * "What are you looking to improve?"
 *
 * A tablist mapping a concern to the services tagged with it. Implemented with
 * the WAI-ARIA tabs pattern: arrow keys move between concerns, and only the
 * active tab is in the tab sequence.
 */
export function ConcernFinder({ services }: { services: Service[] }) {
  const available = useMemo(
    () => SKIN_CONCERNS.filter((c) => services.some((s) => s.concernTags?.includes(c))),
    [services],
  );

  const [active, setActive] = useState<string>(available[0] ?? "");

  const matches = useMemo(
    () => services.filter((s) => s.concernTags?.includes(active)).slice(0, 6),
    [services, active],
  );

  if (!available.length) return null;

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = available.indexOf(active as (typeof available)[number]);
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % available.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + available.length) % available.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = available.length - 1;
    else return;

    event.preventDefault();
    setActive(available[next]);
    document.getElementById(`concern-tab-${next}`)?.focus();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div
        role="tablist"
        aria-label="Skin concerns"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-2 lg:col-span-5 lg:flex-col lg:gap-0"
      >
        {available.map((concern, i) => {
          const selected = concern === active;
          return (
            <button
              key={concern}
              id={`concern-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls="concern-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(concern)}
              className={cn(
                "group flex min-h-11 items-center justify-between gap-4 text-left transition-colors duration-300",
                "rounded-sm px-4 py-2.5 lg:rounded-none lg:border-b lg:border-line-subtle lg:px-0 lg:py-5",
                selected
                  ? "bg-primary text-on-primary lg:bg-transparent lg:text-ink"
                  : "bg-canvas-sunken text-ink-muted hover:text-ink lg:bg-transparent",
              )}
            >
              <span
                className={cn(
                  "font-display transition-all duration-300 lg:text-2xl",
                  selected ? "lg:translate-x-2" : "lg:text-ink-muted",
                )}
              >
                {concern}
              </span>
              <ArrowRight
                aria-hidden="true"
                className={cn(
                  "hidden size-4 shrink-0 transition-all duration-300 lg:block",
                  selected ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>

      <div
        id="concern-panel"
        role="tabpanel"
        aria-label={`Treatments for ${active}`}
        tabIndex={0}
        className="lg:col-span-7"
      >
        <ul className="divide-y divide-line-subtle border-y border-line-subtle">
          {matches.map((service) => (
            <li key={service.id}>
              <Link
                href={`/services/${service.slug}`}
                className="group flex items-start justify-between gap-6 py-5 transition-colors hover:bg-canvas-sunken/50"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink">{service.name}</p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">
                    {service.shortDescription}
                  </p>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-ink-subtle transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink"
                />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs leading-relaxed text-ink-subtle">
          These are the treatments most often used for this concern. Which is right for you — if
          any — is determined by a clinician at consultation.
        </p>
      </div>
    </div>
  );
}
