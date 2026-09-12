import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarPlus,
  FileText,
  Lock,
  MessageCircle,
  Phone,
  Receipt,
  Stethoscope,
  Syringe,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Badge, DetailRow, EmptyState } from "@/components/ui/primitives";
import {
  AdminPageHeader,
  AdminSection,
  AppointmentStatusBadge,
  InvoiceStatusBadge,
} from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getConsultationsForPatient,
  getInvoicesForPatient,
  getPatient,
  getTreatmentsForPatient,
  getUpcomingAppointmentsForPatient,
} from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  whatsappLink,
} from "@/lib/utils/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatient(id);
  return { title: patient?.fullName ?? "Patient" };
}

/**
 * Patient record.
 *
 * The clinical timeline is gated on `patients.medical.read`, so a receptionist
 * sees appointments and billing while consultations and treatment notes are
 * replaced with an explicit "restricted" panel rather than silently omitted.
 */
export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "patients.read")) notFound();

  const patient = await getPatient(id);
  if (!patient) notFound();

  const canSeeClinical = hasPermission(ctx, "patients.medical.read");

  const [appointments, invoices, consultations, treatments, settings] = await Promise.all([
    getUpcomingAppointmentsForPatient(id),
    hasPermission(ctx, "invoices.read") ? getInvoicesForPatient(id) : [],
    canSeeClinical ? getConsultationsForPatient(id) : [],
    canSeeClinical ? getTreatmentsForPatient(id) : [],
    getSettings(),
  ]);

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31_557_600_000)
    : null;

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title={patient.fullName}
        description={`${patient.patientCode} · Registered ${formatDate(patient.registrationDate)}`}
        breadcrumb={[
          { label: "Clinic", href: "/admin" },
          { label: "Patients", href: "/admin/clinic/patients" },
          { label: patient.fullName },
        ]}
        actions={
          <>
            <ButtonLink
              href={whatsappLink(
                patient.whatsapp ?? patient.phone,
                `Hello ${patient.fullName}, this is ${settings.clinicName}.`,
              )}
              target="_blank"
              variant="outline"
              icon={<MessageCircle />}
            >
              WhatsApp
            </ButtonLink>
            <ButtonLink
              href={`/admin/clinic/appointments/new?patientId=${patient.id}`}
              icon={<CalendarPlus />}
            >
              Book
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <aside className="space-y-6">
          <AdminSection title="Contact">
            <dl className="divide-y divide-line-subtle px-5 py-1">
              <DetailRow label="Phone" value={patient.phone} />
              <DetailRow label="WhatsApp" value={patient.whatsapp ?? patient.phone} />
              <DetailRow label="Email" value={patient.email ?? "—"} />
              <DetailRow label="City" value={patient.city ?? "—"} />
              <DetailRow label="Address" value={patient.address ?? "—"} />
            </dl>
          </AdminSection>

          <AdminSection title="Profile">
            <dl className="divide-y divide-line-subtle px-5 py-1">
              <DetailRow label="Gender" value={patient.gender} />
              <DetailRow
                label="Date of birth"
                value={
                  patient.dateOfBirth
                    ? `${formatDate(patient.dateOfBirth)}${age ? ` · ${age}` : ""}`
                    : "—"
                }
              />
              <DetailRow label="Source" value={<Badge tone="neutral">{patient.source}</Badge>} />
              <DetailRow
                label="Emergency contact"
                value={
                  patient.emergencyContactName
                    ? `${patient.emergencyContactName} · ${patient.emergencyContactPhone ?? ""}`
                    : "—"
                }
              />
            </dl>
          </AdminSection>

          <AdminSection title="Account">
            <dl className="divide-y divide-line-subtle px-5 py-1">
              <DetailRow label="Total visits" value={patient.stats?.totalVisits ?? 0} />
              <DetailRow
                label="Lifetime value"
                value={formatCurrency(patient.stats?.totalSpend ?? 0, settings.currencySymbol)}
              />
              <DetailRow
                label="Outstanding"
                value={
                  (patient.stats?.outstandingBalance ?? 0) > 0 ? (
                    <span className="text-danger">
                      {formatCurrency(
                        patient.stats?.outstandingBalance ?? 0,
                        settings.currencySymbol,
                      )}
                    </span>
                  ) : (
                    "Nothing due"
                  )
                }
              />
              <DetailRow label="Loyalty points" value={patient.loyaltyPoints ?? 0} />
            </dl>
          </AdminSection>

          <a
            href={`tel:${patient.phone.replace(/\s/g, "")}`}
            className="flex h-11 items-center justify-center gap-2 rounded-sm border border-line text-sm text-ink transition-colors hover:border-ink hover:bg-canvas-sunken"
          >
            <Phone className="size-4" aria-hidden="true" />
            {patient.phone}
          </a>
        </aside>

        {/* Timeline */}
        <div className="space-y-6 lg:col-span-2">
          <AdminSection
            title="Appointments"
            description={`${appointments.length} recorded`}
            action={
              <Link
                href={`/admin/clinic/appointments/new?patientId=${patient.id}`}
                className="text-xs text-ink-muted transition-colors hover:text-ink"
              >
                Book another
              </Link>
            }
          >
            {appointments.length === 0 ? (
              <EmptyState icon={<CalendarPlus />} title="No appointments yet" />
            ) : (
              <ul className="divide-y divide-line-subtle">
                {appointments.slice(0, 10).map((appt) => (
                  <li key={appt.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="w-28 shrink-0 text-sm tabular-nums text-ink">
                      {formatDate(`${appt.date}T00:00:00`, "d MMM yyyy")}
                    </span>
                    <span className="w-20 shrink-0 text-sm tabular-nums text-ink-muted">
                      {formatTime(appt.startTime)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {appt.serviceName}
                      <span className="ml-2 text-ink-subtle">{appt.doctorName}</span>
                    </span>
                    <AppointmentStatusBadge status={appt.status} />
                  </li>
                ))}
              </ul>
            )}
          </AdminSection>

          {/* Clinical — restricted */}
          {canSeeClinical ? (
            <>
              <AdminSection title="Consultations" description={`${consultations.length} recorded`}>
                {consultations.length === 0 ? (
                  <EmptyState icon={<Stethoscope />} title="No consultations recorded" />
                ) : (
                  <ul className="divide-y divide-line-subtle">
                    {consultations.map((c) => (
                      <li key={c.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <p className="text-sm font-medium text-ink">{c.chiefConcern}</p>
                          <span className="text-xs text-ink-subtle">{formatDateTime(c.date)}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-ink-subtle">{c.doctorName}</p>
                        {c.assessment && (
                          <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-muted">
                            {c.assessment}
                          </p>
                        )}
                        {c.recommendedServiceNames?.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-1.5">
                            {c.recommendedServiceNames.map((name) => (
                              <li key={name}>
                                <Badge tone="accent">{name}</Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </AdminSection>

              <AdminSection title="Treatments" description={`${treatments.length} recorded`}>
                {treatments.length === 0 ? (
                  <EmptyState icon={<Syringe />} title="No treatments recorded" />
                ) : (
                  <ul className="divide-y divide-line-subtle">
                    {treatments.map((t) => (
                      <li key={t.id} className="px-5 py-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                          <p className="text-sm font-medium text-ink">
                            {t.serviceName}
                            <span className="ml-2 text-xs font-normal text-ink-subtle">
                              Session {t.sessionNumber} · {t.treatmentArea}
                            </span>
                          </p>
                          <span className="text-xs text-ink-subtle">{formatDate(t.date)}</span>
                        </div>
                        <p className="mt-1.5 text-xs text-ink-subtle">{t.doctorName}</p>
                        {t.productsUsed?.length > 0 && (
                          <p className="mt-2 text-xs text-ink-muted">
                            Used:{" "}
                            {t.productsUsed
                              .map(
                                (p) =>
                                  `${p.productName} ${p.quantity}${p.unit}${p.batchNumber ? ` (${p.batchNumber})` : ""}`,
                              )
                              .join(", ")}
                          </p>
                        )}
                        {(t.beforeImagePaths?.length > 0 || t.afterImagePaths?.length > 0) && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-subtle">
                            <Lock className="size-3" aria-hidden="true" />
                            {t.beforeImagePaths.length + t.afterImagePaths.length} clinical images
                            held privately
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </AdminSection>
            </>
          ) : (
            <AdminSection title="Clinical record">
              <EmptyState
                icon={<Lock />}
                title="Restricted"
                description="Consultations, treatment notes and clinical photographs are visible only to clinical staff. Your role does not include medical record access."
              />
            </AdminSection>
          )}

          {hasPermission(ctx, "invoices.read") && (
            <AdminSection
              title="Billing"
              description={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
            >
              {invoices.length === 0 ? (
                <EmptyState icon={<Receipt />} title="No invoices yet" />
              ) : (
                <ul className="divide-y divide-line-subtle">
                  {invoices.map((invoice) => (
                    <li key={invoice.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <Link
                        href={`/admin/clinic/invoices/${invoice.id}`}
                        className="font-mono text-xs text-ink hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                      <span className="text-xs text-ink-subtle">{formatDate(invoice.date)}</span>
                      <span className="ml-auto text-sm tabular-nums text-ink">
                        {formatCurrency(invoice.total, settings.currencySymbol)}
                      </span>
                      <InvoiceStatusBadge status={invoice.status} />
                    </li>
                  ))}
                </ul>
              )}
            </AdminSection>
          )}
        </div>
      </div>
    </>
  );
}
