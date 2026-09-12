import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ServiceEditor } from "@/components/admin/service-editor";
import { requirePermission } from "@/lib/auth/session";
import { getServiceCategories, getServices } from "@/lib/cms/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = (await getServices()).find((s) => s.id === id);
  return { title: service ? `Edit ${service.name}` : "Treatment" };
}

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("cms.services.write");

  const { id } = await params;
  const [services, categories] = await Promise.all([getServices(), getServiceCategories()]);
  const service = services.find((s) => s.id === id);
  if (!service) notFound();

  return (
    <>
      <AdminPageHeader
        domain="website"
        title={service.name}
        description={`Live at /services/${service.slug}`}
        breadcrumb={[
          { label: "Website", href: "/admin" },
          { label: "Treatments", href: "/admin/website/services" },
          { label: service.name },
        ]}
        actions={
          <ButtonLink
            href={`/services/${service.slug}`}
            target="_blank"
            variant="outline"
            icon={<ExternalLink />}
          >
            View live
          </ButtonLink>
        }
      />
      <div className="max-w-4xl">
        <ServiceEditor service={service} categories={categories} />
      </div>
    </>
  );
}
