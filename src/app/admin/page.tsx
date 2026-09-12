import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Clock,
  FileText,
  Globe,
  Package,
  Receipt,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/primitives";
import {
  AdminPageHeader,
  AdminSection,
  AppointmentStatusBadge,
  StatCard,
} from "@/components/admin/admin-ui";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission, ROLE_LABELS } from "@/lib/auth/permissions";
import {
  getAppointmentRequests,
  getAppointmentsForDate,
  getExpiringBatches,
  getLowStockProducts,
  getTodaySummary,
} from "@/lib/admin/queries";
import { getServices, getSettings } from "@/lib/cms/queries";
import { dateKey, formatCurrency, formatRelative, formatTime } from "@/lib/utils/format";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const ctx = (await getAuthContext())!;
  const settings = await getSettings();

  const canClinic = hasPermission(ctx, "appointments.read");
  const canInventory = hasPermission(ctx, "inventory.read");
  const canWebsite = hasPermission(ctx, "cms.services.read");

  const [summary, appointments, requests, lowStock, expiring, services] = await Promise.all([
    canClinic ? getTodaySummary() : null,
    canClinic ? getAppointmentsForDate(dateKey()) : [],
    hasPermission(ctx, "appointments.write") ? getAppointmentRequests("New") : [],
    canInventory ? getLowStockProducts() : [],
    canInventory ? getExpiringBatches(60) : [],
    canWebsite ? getServices() : [],
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <AdminPageHeader
        title={`${greeting}.`}
        description={`Signed in as ${ROLE_LABELS[ctx.role]} · ${settings.clinicName}, ${settings.city}`}
        actions={
          canClinic ? (
            <>
              <ButtonLink href="/admin/clinic/front-desk" icon={<Clock />}>
                Front Desk
              </ButtonLink>
              <ButtonLink href="/admin/clinic/appointments/new" variant="outline" icon={<CalendarCheck />}>
                Book
              </ButtonLink>
            </>
          ) : undefined
        }
      />

      {/* Attention strip — only rendered when something actually needs action. */}
      {(requests.length > 0 || lowStock.length > 0 || expiring.length > 0) && (
        <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {requests.length > 0 && (
            <AttentionCard
              href="/admin/clinic/requests"
              tone="info"
              icon={<CalendarClock />}
              title={`${requests.length} booking ${requests.length === 1 ? "request" : "requests"}`}
              body="Website requests waiting to be confirmed with a patient."
            />
          )}
          {lowStock.length > 0 && (
            <AttentionCard
              href="/admin/inventory/products?filter=low"
              tone="warning"
              icon={<Package />}
              title={`${lowStock.length} ${lowStock.length === 1 ? "product" : "products"} low`}
              body="Stock has fallen to or below the minimum level."
            />
          )}
          {expiring.length > 0 && (
            <AttentionCard
              href="/admin/inventory/expiry"
              tone="critical"
              icon={<AlertTriangle />}
              title={`${expiring.length} ${expiring.length === 1 ? "batch" : "batches"} expiring`}
              body="Expiring within 60 days. Use these first under FEFO."
            />
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Clinic operations                                                   */}
      {/* ------------------------------------------------------------------ */}
      {canClinic && summary && (
        <section className="mb-10">
          <DomainHeading
            icon={<Stethoscope className="size-4" />}
            title="Clinic Operations"
            description="Today at the clinic"
            href="/admin/clinic/front-desk"
            linkLabel="Open front desk"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Appointments today"
              value={summary.total}
              hint={`${summary.confirmed} confirmed`}
              icon={<CalendarCheck />}
              href="/admin/clinic/appointments"
            />
            <StatCard
              label="In the clinic now"
              value={summary.checkedIn}
              hint={`${summary.waiting} waiting`}
              tone={summary.waiting > 3 ? "warning" : "neutral"}
              icon={<Users />}
              href="/admin/clinic/queue"
            />
            <StatCard
              label="Completed"
              value={summary.completed}
              hint={summary.noShows > 0 ? `${summary.noShows} no-show` : "No no-shows"}
              tone={summary.noShows > 0 ? "warning" : "positive"}
              icon={<TrendingUp />}
            />
            <StatCard
              label="Collected today"
              value={formatCurrency(summary.revenue, settings.currencySymbol, { compact: true })}
              hint={
                summary.outstanding > 0
                  ? `${formatCurrency(summary.outstanding, settings.currencySymbol, { compact: true })} outstanding`
                  : "Nothing outstanding"
              }
              tone={summary.outstanding > 0 ? "warning" : "positive"}
              icon={<Receipt />}
              href="/admin/clinic/invoices"
            />
          </div>

          <div className="mt-4">
            <AdminSection
              title="Today's schedule"
              description={new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              action={
                <Link
                  href="/admin/clinic/appointments"
                  className="text-xs text-ink-muted transition-colors hover:text-ink"
                >
                  View all
                </Link>
              }
            >
              {appointments.length === 0 ? (
                <EmptyState
                  icon={<CalendarCheck />}
                  title="Nothing booked for today"
                  description="New appointments will appear here as they are booked."
                  action={
                    <ButtonLink href="/admin/clinic/appointments/new" size="sm" icon={<UserPlus />}>
                      Book an appointment
                    </ButtonLink>
                  }
                />
              ) : (
                <TableWrap className="rounded-none border-0">
                  <Table>
                    <thead>
                      <tr>
                        <Th>Time</Th>
                        <Th>Patient</Th>
                        <Th>Treatment</Th>
                        <Th>Clinician</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.slice(0, 8).map((appt) => (
                        <Tr key={appt.id}>
                          <Td className="whitespace-nowrap font-medium tabular-nums">
                            {formatTime(appt.startTime)}
                          </Td>
                          <Td>
                            <Link
                              href={`/admin/clinic/patients/${appt.patientId}`}
                              className="font-medium hover:underline"
                            >
                              {appt.patientName}
                            </Link>
                          </Td>
                          <Td className="text-ink-muted">{appt.serviceName}</Td>
                          <Td className="text-ink-muted">{appt.doctorName}</Td>
                          <Td>
                            <AppointmentStatusBadge status={appt.status} />
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </AdminSection>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Website                                                             */}
      {/* ------------------------------------------------------------------ */}
      {canWebsite && (
        <section>
          <DomainHeading
            icon={<Globe className="size-4 text-champagne-500" />}
            title="Website"
            description="What the public sees"
            href="/admin/website/pages"
            linkLabel="Manage website"
            accent
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Live treatments"
              value={services.filter((s) => s.isActive).length}
              hint={`${services.filter((s) => s.showOnHomepage).length} on the homepage`}
              icon={<FileText />}
              href="/admin/website/services"
            />
            <StatCard
              label="Featured"
              value={services.filter((s) => s.isFeatured).length}
              hint="Marked as signature treatments"
              icon={<TrendingUp />}
              href="/admin/website/services"
            />
            <StatCard
              label="Online booking"
              value={settings.onlineBookingEnabled ? "On" : "Off"}
              hint={settings.onlineBookingEnabled ? "Accepting requests" : "Form is hidden"}
              tone={settings.onlineBookingEnabled ? "positive" : "warning"}
              icon={<CalendarClock />}
              href="/admin/website/settings"
            />
            <StatCard
              label="Google rating"
              value={settings.googleRating?.toFixed(1) ?? "—"}
              hint={`${settings.googleReviewCount ?? 0} reviews shown`}
              icon={<TrendingUp />}
              href="/admin/website/settings"
            />
          </div>
        </section>
      )}

      {/* Requests preview */}
      {requests.length > 0 && (
        <div className="mt-10">
          <AdminSection
            title="Booking requests"
            description="Submitted through the website — each needs confirming by phone"
            action={
              <ButtonLink href="/admin/clinic/requests" size="sm" variant="outline" iconRight={<ArrowRight />}>
                Handle
              </ButtonLink>
            }
          >
            <ul className="divide-y divide-line-subtle">
              {requests.slice(0, 5).map((req) => (
                <li key={req.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{req.fullName}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-subtle">
                      {req.phone}
                      {req.preferredServiceName ? ` · ${req.preferredServiceName}` : ""}
                    </p>
                  </div>
                  {req.preferredDate && (
                    <Badge tone="neutral">
                      {req.preferredDate}
                      {req.preferredTime ? ` · ${req.preferredTime}` : ""}
                    </Badge>
                  )}
                  <span className="text-xs text-ink-subtle">{formatRelative(req.createdAt)}</span>
                </li>
              ))}
            </ul>
          </AdminSection>
        </div>
      )}
    </>
  );
}

function DomainHeading({
  icon,
  title,
  description,
  href,
  linkLabel,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className={accent ? "text-champagne-500" : "text-ink-muted"}>
          {icon}
        </span>
        <div>
          <h2
            className={`text-xs font-semibold uppercase tracking-[0.16em] ${
              accent ? "text-champagne-600" : "text-ink"
            }`}
          >
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-ink-subtle">{description}</p>
        </div>
      </div>
      <Link href={href} className="text-xs text-ink-muted transition-colors hover:text-ink">
        {linkLabel} →
      </Link>
    </div>
  );
}

function AttentionCard({
  href,
  tone,
  icon,
  title,
  body,
}: {
  href: string;
  tone: "info" | "warning" | "critical";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const styles = {
    info: "border-info/25 bg-info-bg text-info",
    warning: "border-warning/30 bg-warning-bg text-warning",
    critical: "border-danger/30 bg-danger-bg text-danger",
  }[tone];

  return (
    <Link
      href={href}
      className={`flex gap-3.5 rounded-md border p-4 transition-shadow hover:shadow-card ${styles}`}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0 [&>svg]:size-4">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{body}</span>
      </span>
    </Link>
  );
}
