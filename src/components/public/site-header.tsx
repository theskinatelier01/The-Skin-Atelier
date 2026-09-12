"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu as MenuIcon, Phone, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { ButtonLink } from "@/components/ui/button";
import type { MenuItem } from "@/types";

/**
 * Site header.
 *
 * Over a hero the header starts transparent with light text, then commits to
 * the solid ivory treatment once scrolled. Pages without a hero get the solid
 * treatment immediately, so contrast is never ambiguous.
 */
export function SiteHeader({
  items,
  clinicName,
  phone,
  heroPaths = ["/"],
  announcement,
}: {
  items: MenuItem[];
  clinicName: string;
  phone: string;
  /** Routes that render a full-bleed hero behind the header. */
  heroPaths?: string[];
  announcement?: { enabled: boolean; text: string; href?: string } | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const transparentOverHero = heroPaths.includes(pathname);

  useEffect(() => {
    if (!transparentOverHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    // Passive listener keeps scrolling off the main thread's critical path.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparentOverHero]);

  // Close the mobile sheet on navigation.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = !transparentOverHero || scrolled;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-canvas-raised focus:px-4 focus:py-2 focus:text-sm focus:shadow-lifted"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-editorial",
          solid
            ? "border-b border-line-subtle bg-canvas/95 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        {/* The announcement strip lives inside the fixed stack so it cannot be
            overlapped by the header at the top of the page. */}
        {announcement?.enabled && (
          <div className="no-print bg-charcoal-900 text-ivory-100">
            <div className="container-editorial flex min-h-9 items-center justify-center py-1.5 text-center">
              {announcement.href ? (
                <Link href={announcement.href} className="link-reveal text-[0.625rem] uppercase tracking-[0.2em]">
                  {announcement.text}
                  <span className="link-reveal-line" />
                </Link>
              ) : (
                <p className="text-[0.625rem] uppercase tracking-[0.2em]">{announcement.text}</p>
              )}
            </div>
          </div>
        )}

        <div className="container-editorial">
          <div
            className={cn(
              "flex items-center justify-between gap-6 transition-all duration-500",
              solid ? "h-16 lg:h-[4.5rem]" : "h-20 lg:h-24",
            )}
          >
            <Link
              href="/"
              className={cn(
                "font-display text-lg leading-none tracking-[0.02em] transition-colors lg:text-xl",
                solid ? "text-ink" : "text-white",
              )}
              aria-label={`${clinicName} — home`}
            >
              {clinicName}
              <span
                className={cn(
                  "mt-1 block text-[0.5625rem] font-sans uppercase tracking-[0.32em] transition-colors",
                  solid ? "text-ink-subtle" : "text-white/70",
                )}
              >
                Islamabad
              </span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
              {items.map((item) => {
                const active = pathname === item.url || pathname.startsWith(`${item.url}/`);
                return (
                  <Link
                    key={item.id}
                    href={item.url}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "link-reveal text-[0.8125rem] tracking-[0.06em] transition-colors duration-200",
                      solid
                        ? active
                          ? "text-ink"
                          : "text-ink-muted hover:text-ink"
                        : "text-white/85 hover:text-white",
                    )}
                  >
                    {item.label}
                    <span className={cn("link-reveal-line", active && "scale-x-100")} />
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-4 lg:flex">
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className={cn(
                  "flex items-center gap-2 text-[0.8125rem] tracking-[0.04em] transition-colors",
                  solid ? "text-ink-muted hover:text-ink" : "text-white/85 hover:text-white",
                )}
              >
                <Phone className="size-3.5" aria-hidden="true" />
                {phone}
              </a>
              <ButtonLink href="/book" variant={solid ? "primary" : "outline"} size="sm"
                className={cn(!solid && "border-white/45 text-white hover:border-white hover:bg-white/10")}>
                Book Consultation
              </ButtonLink>
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className={cn(
                "-mr-2 grid size-11 place-items-center lg:hidden",
                solid ? "text-ink" : "text-white",
              )}
            >
              <MenuIcon className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "absolute inset-0 bg-charcoal-950/30 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal={open || undefined}
          aria-label="Menu"
          className={cn(
            "absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-canvas shadow-overlay transition-transform duration-400 ease-editorial",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-20 items-center justify-between border-b border-line-subtle px-6">
            <span className="font-display text-lg">{clinicName}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="-mr-2 grid size-11 place-items-center text-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6 py-8">
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.url}
                    className="block border-b border-line-subtle py-4 font-display text-2xl text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3 border-t border-line-subtle px-6 py-6">
            <ButtonLink href="/book" fullWidth size="lg">
              Book Consultation
            </ButtonLink>
            <ButtonLink href={`tel:${phone.replace(/\s/g, "")}`} variant="outline" fullWidth size="lg" icon={<Phone />}>
              {phone}
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
