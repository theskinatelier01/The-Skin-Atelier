"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CheckCircle2, Copy, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { uploadMedia } from "@/components/admin/image-field";

interface Uploaded {
  name: string;
  url: string;
  sizeBytes: number;
}

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"];

/**
 * Direct-to-storage uploader.
 *
 * Files go from the browser straight to Cloud Storage rather than through the
 * Next.js server, so a large image never occupies a serverless function or
 * counts against its request body limit. The Storage rules are what authorise
 * the write; the checks here exist to fail fast with a useful message.
 */
export function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<Uploaded[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function upload(files: FileList | File[]) {
    setError(null);


    const list = Array.from(files);
    for (const file of list) {
      if (!ACCEPTED.includes(file.type)) {
        setError(`${file.name}: only JPEG, PNG, WebP, AVIF, MP4 and WebM are accepted.`);
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than the 25MB limit.`);
        return;
      }
    }

    setUploading(true);
    setProgress(0);

    try {
      for (const [index, file] of list.entries()) {
        setProgress(Math.round((index / list.length) * 100));
        const url = await uploadMedia(file);
        setUploaded((current) => [{ name: file.name, url, sizeBytes: file.size }, ...current]);
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "The upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-sm border border-dashed p-6 text-center transition-colors",
          dragging ? "border-accent bg-ivory-200" : "border-line",
        )}
      >
        <Upload aria-hidden="true" className="mx-auto size-5 text-ink-subtle" />
        <p className="mt-3 text-sm text-ink">Drag files here</p>
        <p className="mt-1 text-xs text-ink-subtle">JPEG, PNG, WebP, AVIF, MP4 or WebM up to 25MB</p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => e.target.files && void upload(e.target.files)}
        />

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-4"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? `Uploading ${progress}%` : "Choose files"}
        </Button>
      </div>

      {uploading && (
        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-canvas-sunken"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div
            className="h-full bg-champagne-400 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-sm bg-danger-bg px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {uploaded.length > 0 && (
        <ul className="mt-4 space-y-2">
          {uploaded.map((file) => (
            <li key={file.url} className="rounded-sm border border-line-subtle p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink">{file.name}</p>
                  <p className="mt-0.5 text-[0.6875rem] text-ink-subtle">
                    {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(file.url);
                    setCopied(file.url);
                    window.setTimeout(() => setCopied(null), 2000);
                  }}
                  className="shrink-0 text-[0.6875rem] text-ink-muted transition-colors hover:text-ink"
                >
                  {copied === file.url ? (
                    "Copied"
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Copy className="size-3" aria-hidden="true" />
                      Copy URL
                    </span>
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
