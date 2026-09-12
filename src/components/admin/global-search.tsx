"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { searchEverything, type SearchHit } from "@/server/actions/search";

/**
 * Global command palette.
 *
 * Searches across patients, appointments, invoices, services, products,
 * suppliers, staff and leads. The query runs server-side so that permission
 * checks apply per collection — a front desk user searching "botox" gets the
 * service and the appointments, but never the stock ledger.
 */
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHits([]);
      setCursor(0);
      // Defer so the input exists before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Debounced search; an in-flight request is abandoned when the query moves on.
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchEverything(trimmed);
        if (!cancelled) {
          setHits(results);
          setCursor(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchHit[]>();
    for (const hit of hits) {
      const list = map.get(hit.group) ?? [];
      list.push(hit);
      map.set(hit.group, list);
    }
    return [...map.entries()];
  }, [hits]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(c + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (event.key === "Enter" && hits[cursor]) {
      event.preventDefault();
      router.push(hits[cursor].href);
      onClose();
    }
  }

  if (!open || typeof document === "undefined") return null;

  let index = -1;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-charcoal-950/40 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={onKeyDown}
        className="relative flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-canvas-raised shadow-overlay"
      >
        <div className="flex items-center gap-3 border-b border-line-subtle px-5">
          <Search className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, appointments, invoices, products…"
            aria-label="Search the clinic system"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls="search-results"
            className="h-14 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
          />
          {loading && <Loader2 className="size-4 animate-spin text-ink-subtle" aria-hidden="true" />}
        </div>

        <div id="search-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-subtle">
              Type at least two characters to search.
            </p>
          ) : !loading && hits.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-subtle">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group}>
                <p className="sticky top-0 border-b border-line-subtle bg-canvas-sunken px-5 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                  {group}
                </p>
                <ul>
                  {items.map((hit) => {
                    index += 1;
                    const selected = index === cursor;
                    return (
                      <li key={`${hit.group}-${hit.id}`} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          onMouseEnter={() => setCursor(hits.indexOf(hit))}
                          onClick={() => {
                            router.push(hit.href);
                            onClose();
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors",
                            selected ? "bg-canvas-sunken" : "hover:bg-canvas-sunken/60",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-ink">{hit.title}</span>
                            {hit.subtitle && (
                              <span className="mt-0.5 block truncate text-xs text-ink-subtle">
                                {hit.subtitle}
                              </span>
                            )}
                          </span>
                          {hit.meta && (
                            <span className="shrink-0 text-xs tabular-nums text-ink-subtle">
                              {hit.meta}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line-subtle bg-canvas px-5 py-2.5 text-[0.6875rem] text-ink-subtle">
          <span>↑ ↓ to navigate</span>
          <span>↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
