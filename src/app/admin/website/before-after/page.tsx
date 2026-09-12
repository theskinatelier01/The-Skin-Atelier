import { notFound } from "next/navigation";
import { Lock, ShieldAlert, ShieldCheck } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection, StatCard } from "@/components/admin/admin-ui";
import { BeforeAfterCaseActions } from "@/components/admin/before-after-actions";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getBeforeAfterCases } from "@/lib/admin/queries";
import { anonymiseName, formatDate } from "@/lib/utils/format";
import type { BeforeAfterCase, ConsentStatus, PublicationStatus } from "@/types";

export const metadata = { title: "Before & After" };
export const dynamic = "force-dynamic";

const CONSENT_TONE: Record<ConsentStatus, "success" | "warning" | "danger" | "neutral"> = {
  Granted: "success",
  Requested: "warning",
  "Not Requested": "neutral",
  Declined: "danger",
  Withdrawn: "danger",
};

const PUBLICATION_TONE: Record<PublicationStatus, "success" | "warning" | "info" | "neutral" | "danger"> = {
  Published: "success",
  Approved: "info",
  "Pending Review": "warning",
  Private: "neutral",
  Rejected: "danger",
};

/**
 * Before and after case review.
 *
 * The gate is deliberately two-part: consent recorded from the patient, and
 * approval by an administrator. This screen shows both plainly and refuses to
 * offer a publish control where consent is missing, so the safe path is also
 * the only available one.
 */
export default async function BeforeAfterPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "cms.beforeAfter.read")) notFound();

  const cases = (await getBeforeAfterCases()) as BeforeAfterCase[];
  const canApprove = hasPermission(ctx, "cms.beforeAfter.approve");

  const published = cases.filter((c) => c.publicationStatus === "Published");
  const pending = cases.filter((c) => c.publicationStatus === "Pending Review");
  const awaitingConsent = cases.filter((c) => c.consentStatus !== "Granted");

  return (
    <>
      <AdminPageHeader
        domain="website"
        title="Before &amp; After"
        description="Patient imagery is private by default. Nothing reaches the website without recorded consent and an explicit approval."
        breadcrumb={[{ label: "Website", href: "/admin" }, { label: "Before & After" }]}
      />

      <div className="mb-5 flex gap-3 rounded-md border border-champagne-300 bg-ivory-300 p-4">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold-700" />
        <div className="text-xs leading-relaxed text-ink-muted">
          <p className="font-medium text-ink">Consent is not implied by treatment</p>
          <p className="mt-1">
            A patient agreeing to be photographed for their clinical record has not agreed to
            publication. Publication consent is separate, must be written, and can be withdrawn at
            any time — at which point the case must be unpublished here, which also clears the
            public copies of the images.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total cases" value={cases.length} icon={<Lock />} />
        <StatCard
          label="Awaiting consent"
          value={awaitingConsent.length}
          tone={awaitingConsent.length > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Pending review"
          value={pending.length}
          tone={pending.length > 0 ? "warning" : "neutral"}
        />
        <StatCard label="Live on the website" value={published.length} tone="positive" icon={<ShieldCheck />} />
      </div>

      <div className="mt-5">
        <AdminSection title="All cases" description={`${cases.length} recorded`}>
          {cases.length === 0 ? (
            <EmptyState
              icon={<Lock />}
              title="No cases recorded"
              description="A clinician creates a case from a treatment record. It stays private until consent is recorded and an administrator approves it."
            />
          ) : (
            <ul className="divide-y divide-line-subtle">
              {cases.map((item) => {
                const publishable = item.consentStatus === "Granted";
                return (
                  <li key={item.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-ink">{item.serviceName}</p>
                          <Badge tone={PUBLICATION_TONE[item.publicationStatus]}>
                            {item.publicationStatus}
                          </Badge>
                          <Badge tone={CONSENT_TONE[item.consentStatus]} dot>
                            Consent: {item.consentStatus}
                          </Badge>
                          {item.anonymous && <Badge tone="neutral">Anonymous</Badge>}
                        </div>

                        <p className="mt-1.5 text-xs text-ink-subtle">
                          {/* Even inside the admin, the name is reduced to initials where the
                              case is marked anonymous, so a shoulder-surfer at reception
                              cannot read it off the screen. */}
                          {item.anonymous
                            ? anonymiseName(item.patientNameInternal)
                            : item.patientNameInternal}
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          {item.treatmentArea}
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          {item.sessions} {item.sessions === 1 ? "session" : "sessions"}
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          {formatDate(item.treatmentDate)}
                        </p>

                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                          {item.description}
                        </p>

                        {item.consentRecordedAt && (
                          <p className="mt-2 text-xs text-ink-subtle">
                            Consent recorded {formatDate(item.consentRecordedAt)}
                            {item.consentDocumentPath ? " · signed document on file" : ""}
                          </p>
                        )}

                        {!publishable && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-warning">
                            <Lock className="size-3" aria-hidden="true" />
                            Cannot be published until written consent is recorded as granted.
                          </p>
                        )}
                      </div>

                      {canApprove && (
                        <BeforeAfterCaseActions
                          caseId={item.id}
                          publishable={publishable}
                          isPublished={item.publicationStatus === "Published"}
                          serviceName={item.serviceName}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminSection>
      </div>
    </>
  );
}
