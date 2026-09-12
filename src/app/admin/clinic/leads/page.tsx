import { Target, TrendingUp } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection, LeadStageBadge, StatCard } from "@/components/admin/admin-ui";
import { requirePermission } from "@/lib/auth/session";
import { getLeads } from "@/lib/admin/queries";
import { formatDate, formatRelative, whatsappLink } from "@/lib/utils/format";
import { LEAD_STAGES } from "@/types";

export const metadata = { title: "Leads" };

/**
 * Lead pipeline.
 *
 * Presented as a column-per-stage board, because the useful question is "what
 * is stuck where", not "list everything in date order".
 */
export default async function LeadsPage() {
  await requirePermission("leads.read");

  const leads = await getLeads();
  const open = leads.filter((l) => !["CONVERTED", "LOST"].includes(l.stage));
  const converted = leads.filter((l) => l.stage === "CONVERTED").length;
  const conversionRate = leads.length ? Math.round((converted / leads.length) * 100) : 0;

  const overdue = open.filter(
    (l) => l.followUpDate && new Date(l.followUpDate).getTime() < Date.now(),
  );

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Leads"
        description="Enquiries from the website, social media and referrals, tracked from first contact to conversion."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Leads" }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total leads" value={leads.length} icon={<Target />} />
        <StatCard label="Open" value={open.length} />
        <StatCard label="Converted" value={converted} tone="positive" icon={<TrendingUp />} />
        <StatCard
          label="Conversion rate"
          value={`${conversionRate}%`}
          hint={`${overdue.length} follow-ups overdue`}
          tone={overdue.length > 0 ? "warning" : "neutral"}
        />
      </div>

      {leads.length === 0 ? (
        <div className="mt-6">
          <AdminSection title="Pipeline">
            <EmptyState
              icon={<Target />}
              title="No leads yet"
              description="Contact form submissions on the website arrive here automatically as new leads."
            />
          </AdminSection>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {LEAD_STAGES.map((stage) => {
            const items = leads.filter((l) => l.stage === stage);
            return (
              <AdminSection key={stage} title={stage} description={`${items.length}`}>
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-ink-subtle">None</p>
                ) : (
                  <ul className="divide-y divide-line-subtle">
                    {items.slice(0, 12).map((lead) => {
                      const isOverdue =
                        lead.followUpDate && new Date(lead.followUpDate).getTime() < Date.now();
                      return (
                        <li key={lead.id} className="px-4 py-3">
                          <p className="truncate text-sm font-medium text-ink">{lead.fullName}</p>
                          <a
                            href={whatsappLink(lead.whatsapp ?? lead.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block truncate text-xs text-ink-subtle hover:text-ink hover:underline"
                          >
                            {lead.phone}
                          </a>
                          {lead.interestedServiceName && (
                            <p className="mt-1 truncate text-xs text-ink-muted">
                              {lead.interestedServiceName}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge tone="neutral">{lead.source}</Badge>
                            {isOverdue && <Badge tone="danger">Follow up</Badge>}
                          </div>
                          <p className="mt-1.5 text-[0.6875rem] text-ink-subtle">
                            {lead.followUpDate
                              ? `Due ${formatDate(lead.followUpDate)}`
                              : formatRelative(lead.createdAt)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </AdminSection>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <AdminSection title="Stage reference">
          <ul className="divide-y divide-line-subtle text-sm">
            {LEAD_STAGES.map((stage) => (
              <li key={stage} className="flex items-center gap-4 px-5 py-2.5">
                <LeadStageBadge stage={stage} />
                <span className="text-ink-muted">{STAGE_HELP[stage]}</span>
              </li>
            ))}
          </ul>
        </AdminSection>
      </div>
    </>
  );
}

const STAGE_HELP: Record<string, string> = {
  NEW: "Enquiry received, nobody has spoken to them yet.",
  CONTACTED: "We have reached out but no consultation is booked.",
  "CONSULTATION BOOKED": "A consultation is in the diary.",
  "CONSULTATION COMPLETED": "Seen by a clinician, deciding whether to proceed.",
  CONVERTED: "Became a paying patient.",
  LOST: "Did not proceed. Record the reason so the pattern is visible.",
};
