"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/**
 * Disclosure list.
 *
 * Built on buttons with `aria-expanded`/`aria-controls` rather than
 * `<details>`, so the open/close transition can be animated and multiple
 * panels can be open at once. Content stays in the DOM for SEO.
 */
export function Accordion({
  items,
  className,
}: {
  items: { id: string; question: string; answer: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={cn("divide-y divide-line-subtle border-y border-line-subtle", className)}>
      {items.map((item) => {
        const expanded = open.has(item.id);
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={expanded}
                aria-controls={`panel-${item.id}`}
                id={`trigger-${item.id}`}
                className="flex w-full items-start justify-between gap-6 py-6 text-left transition-colors hover:text-ink"
              >
                <span className="font-display text-lg leading-snug text-ink">{item.question}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1 grid size-6 shrink-0 place-items-center transition-transform duration-300 ease-editorial",
                    expanded && "rotate-45",
                  )}
                >
                  <Plus className="size-4 text-ink-subtle" />
                </span>
              </button>
            </h3>

            {/* Grid-rows trick animates to auto height without measuring. */}
            <div
              id={`panel-${item.id}`}
              role="region"
              aria-labelledby={`trigger-${item.id}`}
              className={cn(
                "grid transition-all duration-400 ease-editorial",
                expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-7 pr-10 text-[0.9375rem] leading-relaxed text-ink-muted">
                  {item.answer.split("\n\n").map((p) => (
                    <p key={p.slice(0, 30)} className="not-first:mt-4">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
