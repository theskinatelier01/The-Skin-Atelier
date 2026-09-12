import { notFound } from "next/navigation";
import { FolderOpen, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { MediaUploader } from "@/components/admin/media-uploader";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const metadata = { title: "Media Library" };
export const dynamic = "force-dynamic";

/**
 * Media library.
 *
 * Uploads go straight from the browser to Cloud Storage under the `public/`
 * prefix, which the Storage rules restrict to marketing roles and to image and
 * video content types under 50MB. Patient imagery is deliberately not reachable
 * from here: it lives under `patients/`, which this screen cannot list.
 */
export default async function MediaLibraryPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.media.read")) notFound();

  const canUpload = hasPermission(ctx, "cms.media.write");

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Media Library"
        description="Images and video used across the public website."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Media Library" }]}
      />

      <div className="mb-5 flex gap-3 rounded-md border border-line-subtle bg-canvas-sunken p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-champagne-500" />
        <p className="text-xs leading-relaxed text-ink-muted">
          This library holds public website media only. Clinical photographs are stored separately
          under a private path that this screen cannot read, and reach the public site only through
          the consent and approval flow on the Before and After screen.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Storage path" value="public/" icon={<FolderOpen />} hint="World readable" />
        <StatCard label="Max file size" value="50 MB" hint="Images and video" />
        <StatCard label="Upload roles" value="Marketing, Admin" hint="Enforced by Storage rules" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AdminSection title="Upload" description="Files are stored in Cloud Storage">
            <div className="p-5">
              {canUpload ? (
                <MediaUploader />
              ) : (
                <p className="text-sm text-ink-subtle">
                  Your role can view media but not upload it.
                </p>
              )}
            </div>
          </AdminSection>
        </div>

        <div className="lg:col-span-2">
          <AdminSection title="Files" description="Uploaded media">
            <EmptyState
              icon={<FolderOpen />}
              title="No files uploaded yet"
              description="Uploaded media appears here with its dimensions, size and alt text. Use the upload panel to add the clinic photography."
            />
          </AdminSection>
        </div>
      </div>
    </>
  );
}
