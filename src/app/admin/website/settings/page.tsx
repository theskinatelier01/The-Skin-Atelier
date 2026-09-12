import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { requirePermission } from "@/lib/auth/session";
import { getSettings } from "@/lib/cms/queries";

export const metadata = { title: "Website Settings" };
export const dynamic = "force-dynamic";

export default async function WebsiteSettingsPage() {
  await requirePermission("cms.settings.write");
  const settings = await getSettings();

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Website Settings"
        description="Clinic identity, contact details and billing defaults. Saving republishes every page on the public site."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Settings" }]}
      />
      <div className="max-w-4xl">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
