import { notFound } from "next/navigation";
import { HelpCircle } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getFaqs } from "@/lib/cms/queries";

export const metadata = { title: "FAQ" };
export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.faqs.write")) notFound();

  const faqs = await getFaqs();
  const byCategory = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    (acc[faq.category] ??= []).push(faq);
    return acc;
  }, {});

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Frequently Asked Questions"
        description="Shown on the FAQ page and emitted as FAQ structured data, so accurate wording here affects search results."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "FAQ" }]}
      />

      {faqs.length === 0 ? (
        <AdminSection title="FAQ">
          <EmptyState
            icon={<HelpCircle />}
            title="No questions yet"
            description="Add the questions the front desk answers most often."
          />
        </AdminSection>
      ) : (
        <div className="space-y-5">
          {Object.entries(byCategory).map(([category, items]) => (
            <AdminSection key={category} title={category} description={`${items.length} questions`}>
              <ul className="divide-y divide-line-subtle">
                {items.map((faq) => (
                  <li key={faq.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink">{faq.question}</p>
                      <div className="flex shrink-0 gap-1.5">
                        <Badge tone={faq.isVisible ? "success" : "neutral"} dot>
                          {faq.isVisible ? "Visible" : "Hidden"}
                        </Badge>
                        {faq.showOnFaqPage && <Badge tone="neutral">FAQ page</Badge>}
                      </div>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                      {faq.answer}
                    </p>
                  </li>
                ))}
              </ul>
            </AdminSection>
          ))}
        </div>
      )}
    </>
  );
}
