"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Star } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { Testimonial } from "@/types";

/**
 * Testimonial carousel.
 *
 * Follows the accessible-carousel rules: it auto-advances but exposes a pause
 * control, stops on hover and on focus, respects `prefers-reduced-motion`, and
 * every slide is reachable with the previous/next buttons alone. Slide position
 * is announced through a polite live region.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [interacted, setInteracted] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const count = items.length;
  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (!playing || interacted || count < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => window.clearInterval(timer);
  }, [playing, interacted, count]);

  if (!count) return null;

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Patient testimonials"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => !interacted && setPlaying(true)}
      onFocusCapture={() => setPlaying(false)}
    >
      <div className="relative min-h-[20rem] sm:min-h-[17rem]">
        {items.map((t, i) => (
          <figure
            key={t.id}
            aria-hidden={i !== index}
            // Inactive slides stay mounted for layout stability but are removed
            // from the accessibility tree and the tab order.
            inert={i !== index}
            className={cn(
              "absolute inset-0 flex flex-col transition-all duration-700 ease-editorial",
              i === index ? "opacity-100 blur-0" : "pointer-events-none opacity-0 blur-[1px]",
            )}
          >
            <div className="flex gap-1" aria-label={`Rated ${t.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  aria-hidden="true"
                  className={cn(
                    "size-4",
                    s < t.rating ? "fill-champagne-400 text-champagne-400" : "text-line",
                  )}
                />
              ))}
            </div>

            <blockquote className="mt-7 flex-1">
              <p className="font-display text-xl leading-relaxed text-ink sm:text-2xl sm:leading-relaxed">
                &ldquo;{t.body}&rdquo;
              </p>
            </blockquote>

            <figcaption className="mt-8 flex items-center gap-3 text-sm">
              <span className="font-medium text-ink">{t.authorName}</span>
              <span aria-hidden="true" className="h-3 w-px bg-line" />
              <span className="text-ink-subtle">{t.serviceName ?? t.source}</span>
              <span className="eyebrow ml-auto hidden sm:block">via {t.source}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-line-subtle pt-6">
        <p aria-live="polite" className="text-xs tabular-nums text-ink-subtle">
          {index + 1} / {count}
        </p>

        <div className="flex items-center gap-1.5">
          <CarouselButton
            label="Previous testimonial"
            onClick={() => {
              setInteracted(true);
              go(index - 1);
            }}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </CarouselButton>

          <CarouselButton
            label={playing && !interacted ? "Pause testimonials" : "Play testimonials"}
            onClick={() => {
              setInteracted(playing);
              setPlaying((p) => !p);
            }}
          >
            {playing && !interacted ? (
              <Pause className="size-3.5" aria-hidden="true" />
            ) : (
              <Play className="size-3.5" aria-hidden="true" />
            )}
          </CarouselButton>

          <CarouselButton
            label="Next testimonial"
            onClick={() => {
              setInteracted(true);
              go(index + 1);
            }}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </CarouselButton>
        </div>
      </div>
    </div>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full border border-line text-ink transition-colors duration-200 hover:border-ink hover:bg-canvas-sunken"
    >
      {children}
    </button>
  );
}
