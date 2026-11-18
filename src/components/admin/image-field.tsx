"use client";

import { useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";

/** Sends a file to the server-side upload route and returns its public URL. */
export async function uploadMedia(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error ?? "The upload failed. Please try again.");
  return data.url;
}

/**
 * Image picker for content forms: upload a new image or paste a URL, with a
 * live preview. The value is submitted under `name` like any other input.
 */
export function ImageField({
  name,
  label,
  defaultValue,
  hint,
  error,
  required,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setBusy(true);
    try {
      setValue(await uploadMedia(file));
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Field
      label={label}
      error={error ?? uploadError ?? undefined}
      hint={hint ?? "Upload an image, or paste a URL from the media library."}
      required={required}
      className={className}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-sm border border-line-subtle bg-canvas-sunken sm:w-40">
          {value ? (
            // A plain img: the preview must show any URL the editor pastes,
            // including hosts not configured for next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-ink-subtle">
              <ImageIcon aria-hidden="true" className="size-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            name={name}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`${label} URL`}
            placeholder="https://… or /images/…"
            className={cn(
              "h-11 w-full rounded-sm border bg-canvas-raised px-3.5 text-sm text-ink",
              "focus:border-accent focus:outline-none",
              error ? "border-danger" : "border-line",
            )}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={<Upload />}
              loading={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? "Uploading…" : "Upload image"}
            </Button>
            {value && !busy && (
              <Button type="button" size="sm" variant="ghost" icon={<X />} onClick={() => setValue("")}>
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>
      </div>
    </Field>
  );
}
