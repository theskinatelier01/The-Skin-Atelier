"use client";

import { useId, useState } from "react";
import { MoveHorizontal } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { EditorialImage } from "@/components/public/editorial-image";
import type { BeforeAfterCase } from "@/types";

/**
 * Before / after comparison.
 *
 * The control is a native range input rather than a custom drag handle, so it
 * is keyboard operable and screen-reader announced for free. The visual handle
 * is drawn on top and is purely decorative.
 *
 * Only cases that carry recorded consent and admin approval ever reach this
 * component — it renders the public URLs, never the private storage paths.
 */
export function BeforeAfterSlider({
  item,
  className,
}: {
  item: BeforeAfterCase;
  className?: string;
}) {
  const [position, setPosition] = useState(50);
  const id = useId();

  return (
    <figure className={cn("group", className)}>
      <div className="relative aspect-[4/5] select-none overflow-hidden bg-ivory-200">
        {/* After image sits underneath as the base layer. */}
        <EditorialImage
          src={item.publicAfterImageUrl}
          alt={`After ${item.serviceName} treatment`}
          className="absolute inset-0 size-full"
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        {/* Before image is clipped to the slider position. */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <EditorialImage
            src={item.publicBeforeImageUrl}
            alt={`Before ${item.serviceName} treatment`}
            className="absolute inset-0 size-full"
            sizes="(max-width: 768px) 100vw, 33vw"
            tone={2}
          />
        </div>

        {/* Decorative divider and handle. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-px bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.35)]"
          style={{ left: `${position}%` }}
        >
          <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-charcoal-900 shadow-lifted">
            <MoveHorizontal className="size-4" />
          </span>
        </div>

        <span
          aria-hidden="true"
          className="absolute left-4 top-4 bg-charcoal-950/70 px-2 py-1 text-[0.5625rem] uppercase tracking-[0.16em] text-white"
        >
          Before
        </span>
        <span
          aria-hidden="true"
          className="absolute right-4 top-4 bg-charcoal-950/70 px-2 py-1 text-[0.5625rem] uppercase tracking-[0.16em] text-white"
        >
          After
        </span>

        <label htmlFor={id} className="sr-only">
          Reveal the before image for {item.serviceName}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-valuetext={`${position}% before image shown`}
          className="absolute inset-0 size-full cursor-ew-resize appearance-none bg-transparent
                     [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-10
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:opacity-0
                     [&::-moz-range-thumb]:h-full [&::-moz-range-thumb]:w-10
                     [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:opacity-0"
        />
      </div>

      <figcaption className="mt-5">
        <p className="eyebrow">{item.serviceName}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-subtle">
          <div className="flex gap-1.5">
            <dt>Area:</dt>
            <dd className="text-ink">{item.treatmentArea}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Sessions:</dt>
            <dd className="text-ink">{item.sessions}</dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}

/**
 * Shown when the clinic has not yet approved any case for publication. Being
 * explicit about *why* the section is empty is better than hiding it, and it
 * reinforces the consent policy to prospective patients.
 */
export function BeforeAfterEmpty() {
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-xl text-ink">Results are published only with consent</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
        Our before and after gallery is being prepared. We publish a patient photograph only once
        that patient has given explicit written permission, so this gallery grows slowly and with
        care. Ask to see relevant cases during your consultation.
      </p>
    </div>
  );
}
