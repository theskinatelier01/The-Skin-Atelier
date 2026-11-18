"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import type { MediaFile } from "@/lib/cms/admin-content";

/** Uploaded website media with a one-click "copy link" for use in any field. */
export function MediaGrid({ files }: { files: MediaFile[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied((c) => (c === url ? null : c)), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <ul className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
      {files.map((file) => (
        <li key={file.path} className="overflow-hidden rounded-sm border border-line-subtle bg-canvas">
          <div className="aspect-square bg-canvas-sunken">
            {file.contentType.startsWith("video/") ? (
              <video src={file.url} className="size-full object-cover" muted preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.url} alt="" loading="lazy" className="size-full object-cover" />
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2">
            <p className="min-w-0 flex-1 truncate text-xs text-ink-muted" title={file.name}>
              {file.name}
            </p>
            <button
              type="button"
              onClick={() => void copy(file.url)}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-ink-subtle hover:text-ink"
            >
              {copied === file.url ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <Copy className="size-3.5" aria-hidden="true" />
              )}
              {copied === file.url ? "Copied" : "Copy link"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
