"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Globe, LayoutDashboard, Menu, Stethoscope, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { NAVIGATION, type NavGroup } from "@/lib/admin/navigation";
import { hasAnyPermission, ROLE_LABELS, type AuthContext } from "@/lib/auth/permissions";

/**
 * Admin sidebar.
 *
 * The Website / Clinic split is made structural rather than decorative: the two
 * halves are separated by a labelled divider with its own icon and rail colour,
 * so it is always obvious which side of the product you are working in.
 */
export function AdminSidebar({
  ctx,
  badges,
  clinicName,
}: {
  ctx: Pick<AuthContext, "role" | "extraPermissions" | "deniedPermissions" | "email">;
  badges: Partial<Record<string, number>>;
  clinicName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  // Drop any group the user cannot see a single item in.
  const groups = NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => item.permissions.length === 0 || hasAnyPermission(ctx, item.permissions),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="fixed left-4 top-3.5 z-40 grid size-11 place-items-center rounded-sm border border-line bg-canvas-raised text-ink shadow-subtle lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-950/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Admin navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col bg-charcoal-900 text-ivory-100",
          "transition-transform duration-300 ease-editorial lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 border-b border-ivory-100/10 px-5 py-5">
          <Link href="/admin" className="min-w-0">
            <p className="truncate font-display text-base leading-tight">{clinicName}</p>
            <p className="mt-0.5 text-[0.5rem] uppercase tracking-[0.28em] text-ivory-100/45">
              Clinic Management
            </p>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="-mr-2 grid size-10 shrink-0 place-items-center text-ivory-100/70 lg:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group, i) => (
            <NavSection
              key={group.id}
              group={group}
              pathname={pathname}
              badges={badges}
              isFirst={i === 0}
            />
          ))}
        </nav>

        {/* Identity */}
        <div className="border-t border-ivory-100/10 px-5 py-4">
          <p className="truncate text-[0.8125rem] text-ivory-100/85">{ctx.email}</p>
          <p className="mt-0.5 text-[0.625rem] uppercase tracking-[0.16em] text-champagne-400">
            {ROLE_LABELS[ctx.role]}
          </p>
        </div>
      </aside>
    </>
  );
}

function NavSection({
  group,
  pathname,
  badges,
  isFirst,
}: {
  group: NavGroup;
  pathname: string;
  badges: Partial<Record<string, number>>;
  isFirst: boolean;
}) {
  // The two primary domains get a heavier, iconed header; the rest are plain.
  const isPrimary = group.domain === "website" || group.domain === "clinic";
  const Icon =
    group.domain === "website" ? Globe : group.domain === "clinic" ? Stethoscope : LayoutDashboard;

  return (
    <div className={cn(!isFirst && "mt-6")}>
      {group.domain === "overview" ? null : isPrimary ? (
        <div className="mb-2 flex items-center gap-2.5 border-t border-ivory-100/10 px-3 pt-5">
          <Icon
            aria-hidden="true"
            className={cn(
              "size-3.5",
              group.domain === "website" ? "text-champagne-400" : "text-ivory-100/70",
            )}
          />
          <div className="min-w-0">
            <p
              className={cn(
                "text-[0.625rem] font-semibold uppercase tracking-[0.18em]",
                group.domain === "website" ? "text-champagne-400" : "text-ivory-100/85",
              )}
            >
              {group.title}
            </p>
            {group.description && (
              <p className="mt-0.5 truncate text-[0.625rem] text-ivory-100/35">
                {group.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mb-2 border-t border-ivory-100/10 px-3 pt-5 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-ivory-100/45">
          {group.title}
        </p>
      )}

      <ul className="space-y-0.5">
        {group.items.map((item) => {
          // `/admin` must not match every child route.
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.badgeKey ? badges[item.badgeKey] : undefined;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-9 items-center justify-between gap-2 rounded-sm px-3 py-2",
                  "text-[0.8125rem] transition-colors duration-150",
                  active
                    ? "bg-ivory-100/10 text-ivory-100"
                    : "text-ivory-100/60 hover:bg-ivory-100/5 hover:text-ivory-100/90",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-3.5 w-px shrink-0 transition-colors",
                      active
                        ? group.domain === "website"
                          ? "bg-champagne-400"
                          : "bg-ivory-100"
                        : "bg-transparent",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </span>

                {badge !== undefined && badge > 0 && (
                  <span className="shrink-0 rounded-full bg-champagne-400 px-1.5 py-px text-[0.625rem] font-semibold tabular-nums text-charcoal-950">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
