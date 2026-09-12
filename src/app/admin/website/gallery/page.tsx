import { notFound } from "next/navigation";
import { Images } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { EditorialImage } from "@/components/public/editorial-image";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getGallery } from "@/lib/cms/queries";

export const metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.media.read")) notFound();

  const items = await getGallery();

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Gallery"
        description="Clinic photography for the gallery page and the Instagram-style rail on the homepage."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Gallery" }]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Images" value={items.length} icon={<Images />} />
        <StatCard label="Visible" value={items.filter((i) => i.isVisible).length} tone="positive" />
        <StatCard label="On the social rail" value={items.filter((i) => i.isSocial).length} />
      </div>

      <div className="mt-5">
        <AdminSection title="All images" description={`${items.length} in the gallery`}>
          {items.length === 0 ? (
            <EmptyState
              icon={<Images />}
              title="No images yet"
              description="Upload clinic photography through the media library, then add it here."
            />
          ) : (
            <ul className="grid gap-4 p-5 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item, i) => (
                <li key={item.id}>
                  <EditorialImage
                    src={item.imageUrl}
                    alt={item.altText}
                    className="aspect-square w-full rounded-sm"
                    sizes="25vw"
                    tone={i}
                  />
                  <p className="mt-2 truncate text-xs text-ink">{item.altText}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone={item.isVisible ? "success" : "neutral"} dot>
                      {item.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                    {item.isSocial && <Badge tone="accent">Social</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>
      </div>
    </>
  );
}
