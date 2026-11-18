import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { adminBucket, isAdminConfigured } from "@/lib/firebase/admin";
import { slugify } from "@/lib/utils/format";

/**
 * Website media upload.
 *
 * Files are written by the server with the Admin SDK rather than from the
 * browser, so uploads work without depending on the deployed Storage rules.
 * Each file gets a download token, which makes the returned URL readable by
 * anyone — this path only ever holds public website media.
 */

const ACCEPTED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

// Cloud Run caps a request at 32MB, so stay comfortably under it.
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!isAdminConfigured) {
    return NextResponse.json({ error: "Uploads are not available in this environment." }, { status: 503 });
  }

  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!hasPermission(ctx, "cms.media.write")) {
    return NextResponse.json({ error: "Your role cannot upload website media." }, { status: 403 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    file = value instanceof File ? value : null;
  } catch {
    file = null;
  }
  if (!file) return NextResponse.json({ error: "No file was received." }, { status: 400 });

  const extension = ACCEPTED[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, AVIF, GIF, MP4 and WebM files can be uploaded." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Files must be smaller than 25MB." }, { status: 413 });
  }

  try {
    const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 60) || "upload";
    const path = `public/media/${Date.now()}-${base}.${extension}`;
    const token = randomUUID();
    const bucket = adminBucket();

    await bucket.file(path).save(Buffer.from(await file.arrayBuffer()), {
      resumable: false,
      contentType: file.type,
      metadata: {
        cacheControl: "public, max-age=31536000, immutable",
        metadata: { firebaseStorageDownloadTokens: token, uploadedBy: ctx.uid },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    return NextResponse.json({ ok: true, url, path, name: file.name, sizeBytes: file.size });
  } catch (error) {
    console.error("[upload] failed", error);
    return NextResponse.json({ error: "The upload failed. Please try again." }, { status: 500 });
  }
}
