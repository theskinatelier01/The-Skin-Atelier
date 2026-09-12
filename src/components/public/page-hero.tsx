import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/**
 * Inner-page header.
 *
 * Carries the top padding that clears the fixed site header, so individual
 * pages never have to know the header height.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <header
      className={cn(
        "border-b border-line-subtle bg-canvas-sunken pb-14 pt-32 sm:pb-20 sm:pt-40",
        className,
      )}
    >
      <div className="container-editorial">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-subtle">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="size-3" aria-hidden="true" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="link-reveal transition-colors hover:text-ink">
                      {crumb.label}
                      <span className="link-reveal-line" />
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-ink">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-5 font-display text-display-lg">{title}</h1>
          {description && (
            <p className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-muted">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </header>
  );
}
