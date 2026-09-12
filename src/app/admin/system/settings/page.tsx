import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { requirePermission } from "@/lib/auth/session";
import { getSettings } from "@/lib/cms/queries";

export const metadata = { title: "Clinic Settings" };
export const dynamic = "force-dynamic";

/**
 * The same settings document as the website screen, reached from the System
 * area by a super admin. Kept as one document rather than two so the public
 * site and the clinic system can never disagree about the phone number.
 */
export default async function ClinicSettingsPage() {
  await requirePermission("settings.write");
  const settings = await getSettings();

  return (
    <>
      <AdminPageHeader
        title="Clinic Settings"
        description="Central configuration shared by the website, the booking system and invoicing."
        breadcrumb={[{ label: "System", href: "/admin" }, { label: "Settings" }]}
      />
      <div className="max-w-4xl">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
