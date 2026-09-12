"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ExternalLink, LogOut, Search } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./global-search";

/**
 * Admin top bar.
 *
 * Holds the global search (Cmd/Ctrl-K), the notification bell and sign-out.
 * Kept deliberately sparse — the sidebar carries navigation, so this row exists
 * for the things a user needs from anywhere.
 */
export function AdminTopbar({
  unreadCount,
  branchName,
}: {
  unreadCount: number;
  branchName: string;
}) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line-subtle bg-canvas/90 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-4 pl-16 sm:px-6 lg:pl-6">
          {/* Search trigger */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "flex h-10 flex-1 items-center gap-2.5 rounded-sm border border-line bg-canvas-raised px-3.5",
              "text-left text-sm text-ink-subtle transition-colors hover:border-line-strong",
              "max-w-md",
            )}
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">Search patients, invoices, products…</span>
            <kbd className="hidden shrink-0 rounded-xs border border-line px-1.5 py-0.5 font-sans text-[0.625rem] text-ink-subtle sm:block">
              {/* Rendered from a constant so it does not shift between server and client. */}
              Ctrl K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden text-xs text-ink-subtle lg:block">{branchName}</span>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open the public website in a new tab"
              className="grid size-10 place-items-center rounded-sm text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
            </Link>

            <Link
              href="/admin/system/notifications"
              aria-label={
                unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
              }
              className="relative grid size-10 place-items-center rounded-sm text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink"
            >
              <Bell className="size-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.5625rem] font-semibold tabular-nums text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              loading={signingOut}
              icon={<LogOut />}
              className="ml-1"
            >
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <GlobalSearch
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          triggerRef.current?.focus();
        }}
      />
    </>
  );
}
