import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Plus, Sparkles } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { ServiceFlagToggle } from "@/components/admin/service-flag-toggle";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getServices, getSettings } from "@/lib/cms/queries";
import { formatCurrency } from "@/lib/utils/format";

export const metadata = { title: "Services" };
export const dynamic = "force-dynamic";

/**
 * Treatment catalogue.
 *
 * The three visibility flags are toggled inline, because deciding what appears
 * on the homepage is a frequent editorial act that should not require opening
 * a form.
 */
export default async function AdminServicesPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.services.read")) notFound();

  const [services, settings] = await Promise.all([getServices(), getSettings()]);
  const canWrite = hasPermission(ctx, "cms.services.write");

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Treatments"
        description="The public treatment catalogue. Changes appear on the website immediately."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Treatments" }]}
        actions={
          <>
            <ButtonLink href="/services" target="_blank" variant="outline" icon={<ExternalLink />}>
              View live
            </ButtonLink>
            {canWrite && (
              <ButtonLink href="/admin/website/services/new" icon={<Plus />}>
                New treatment
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={services.length} />
        <StatCard
          label="Live"
          value={services.filter((s) => s.isActive).length}
          tone="positive"
        />
        <StatCard
          label="On homepage"
          value={services.filter((s) => s.showOnHomepage).length}
          icon={<Sparkles />}
        />
        <StatCard
          label="Priced on consultation"
          value={services.filter((s) => s.priceOnConsultation).length}
        />
      </div>

      <div className="mt-5">
        <AdminSection title="Catalogue" description={`${services.length} treatments`}>
          {services.length === 0 ? (
            <EmptyState
              title="No treatments yet"
              description="Add the clinic's treatments so they appear on the public website."
              action={
                canWrite ? (
                  <ButtonLink href="/admin/website/services/new" size="sm">
                    Add a treatment
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            <TableWrap className="rounded-none border-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Treatment</Th>
                    <Th>Category</Th>
                    <Th align="right">Price</Th>
                    <Th align="right">Duration</Th>
                    <Th align="center">Live</Th>
                    <Th align="center">Homepage</Th>
                    <Th align="center">Signature</Th>
                    <Th align="right">Link</Th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <Tr key={service.id}>
                      <Td>
                        {canWrite ? (
                          <Link
                            href={`/admin/website/services/${service.id}`}
                            className="font-medium hover:underline"
                          >
                            {service.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{service.name}</span>
                        )}
                        <span className="block font-mono text-xs text-ink-subtle">
                          /services/{service.slug}
                        </span>
                      </Td>
                      <Td className="text-ink-muted">{service.categoryName}</Td>
                      <Td align="right">
                        {service.priceOnConsultation ? (
                          <Badge tone="neutral">On consultation</Badge>
                        ) : (
                          formatCurrency(
                            service.discountedPrice ?? service.price,
                            settings.currencySymbol,
                          )
                        )}
                      </Td>
                      <Td align="right" className="text-ink-muted">
                        {service.durationMinutes} min
                      </Td>
                      <Td align="center">
                        <ServiceFlagToggle
                          serviceId={service.id}
                          field="isActive"
                          value={service.isActive}
                          label={`Publish ${service.name}`}
                          disabled={!canWrite}
                        />
                      </Td>
                      <Td align="center">
                        <ServiceFlagToggle
                          serviceId={service.id}
                          field="showOnHomepage"
                          value={service.showOnHomepage}
                          label={`Show ${service.name} on the homepage`}
                          disabled={!canWrite}
                        />
                      </Td>
                      <Td align="center">
                        <ServiceFlagToggle
                          serviceId={service.id}
                          field="isFeatured"
                          value={service.isFeatured}
                          label={`Mark ${service.name} as a signature treatment`}
                          disabled={!canWrite}
                        />
                      </Td>
                      <Td align="right">
                        <a
                          href={`/services/${service.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${service.name} on the website`}
                          className="inline-grid size-8 place-items-center rounded-sm text-ink-subtle transition-colors hover:bg-canvas-sunken hover:text-ink"
                        >
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </AdminSection>
      </div>
    </>
  );
}
