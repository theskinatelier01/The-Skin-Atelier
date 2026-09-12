import { notFound } from "next/navigation";
import { Menu as MenuIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getMenus } from "@/lib/cms/queries";

export const metadata = { title: "Menus" };
export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.menus.write")) notFound();

  const menus = await getMenus();
  const entries = Object.values(menus);

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Navigation"
        description="The header, footer and legal menus. Order here is the order shown on the site."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Menus" }]}
      />

      {entries.length === 0 ? (
        <AdminSection title="Menus">
          <EmptyState icon={<MenuIcon />} title="No menus configured" />
        </AdminSection>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {entries.map((menu) => (
            <AdminSection
              key={menu.id}
              title={menu.name}
              description={`${menu.items.length} items · key: ${menu.key}`}
            >
              <ol className="divide-y divide-line-subtle">
                {[...menu.items]
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                      <span
                        aria-hidden="true"
                        className="w-6 shrink-0 text-xs tabular-nums text-ink-subtle"
                      >
                        {String(item.order).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{item.label}</span>
                      <span className="shrink-0 font-mono text-xs text-ink-subtle">{item.url}</span>
                    </li>
                  ))}
              </ol>
            </AdminSection>
          ))}
        </div>
      )}
    </>
  );
}
