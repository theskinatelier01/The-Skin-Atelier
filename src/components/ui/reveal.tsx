"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Scroll-triggered reveal.
 *
 * Uses IntersectionObserver rather than a scroll listener so nothing runs on
 * the main thread between intersections, and disconnects after the first
 * reveal. Motion is opt-out via `prefers-reduced-motion`, handled in CSS, but
 * we also short-circuit here so the observer is never created at all.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
  once = true,
}: {
  children: ReactNode;
  /** Stagger offset in milliseconds. */
  delay?: number;
  className?: string;
  as?: ElementType;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      // Fire slightly before the element reaches the fold so the motion has
      // finished by the time it is comfortably in view.
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", className)}
      data-visible={visible}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
