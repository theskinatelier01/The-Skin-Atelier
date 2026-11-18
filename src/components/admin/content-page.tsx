import { notFound } from "next/navigation";

import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { ContentManager } from "@/components/admin/content-manager";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getContentForAdmin } from "@/lib/cms/admin-content";
import { KINDS, type ContentKind } from "@/lib/cms/content-kinds";

/** Shared screen for every collection edited through ContentManager. */
export async function ContentPage({
  kind,
  title,
  description,
}: {
  kind: ContentKind;
  title: string;
  description: string;
}) {
  const def = KINDS[kind];
  const ctx = await getAuthContext();
  if (!ctx || !(hasPermission(ctx, def.readPermission) || hasPermission(ctx, def.writePermission))) {
    notFound();
  }

  const items = await getContentForAdmin(kind);

  return (
    <>
      <AdminPageHeader
        domain="website"
        title={title}
        description={description}
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: title }]}
      />
      <AdminSection title={`All ${def.label.toLowerCase()}`}>
        <ContentManager kind={kind} items={items} canWrite={hasPermission(ctx, def.writePermission)} />
      </AdminSection>
    </>
  );
}
