import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ServiceEditor } from "@/components/admin/service-editor";
import { requirePermission } from "@/lib/auth/session";
import { getServiceCategories } from "@/lib/cms/queries";

export const metadata = { title: "New Treatment" };

export default async function NewServicePage() {
  await requirePermission("cms.services.write");
  const categories = await getServiceCategories();

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="New treatment"
        description="This will appear on the public website as soon as it is published."
        breadcrumb={[
          { label: "Website", href: "/admin" },
          { label: "Treatments", href: "/admin/website/services" },
          { label: "New" },
        ]}
      />
      <div className="max-w-4xl">
        <ServiceEditor categories={categories} />
      </div>
    </>
  );
}
