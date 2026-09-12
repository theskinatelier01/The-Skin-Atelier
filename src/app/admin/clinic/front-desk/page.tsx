import Link from "next/link";
import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  FileText,
  LogIn,
  Receipt,
  Search,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { MobileRowCard, Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import {
  AdminPageHeader,
  AdminSection,
  AppointmentStatusBadge,
  QueueStatusBadge,
  StatCard,
} from "@/components/admin/admin-ui";
import { AppointmentRowActions } from "@/components/admin/appointment-row-actions";
import { QueueActions } from "@/components/admin/queue-actions";
import { requirePermission } from "@/lib/auth/session";
import { getAppointmentsForDate, getQueue, getTodaySummary } from "@/lib/admin/queries";
import { getSettings } from "@/lib/cms/queries";
import { dateKey, formatCurrency, formatRelative, formatTime } from "@/lib/utils/format";

export const metadata = { title: "Front Desk" };

/**
 * Front desk.
 *
 * Built for a receptionist standing at a counter with a patient in front of
 * them: today only, the next action on every row, and the live queue beside it.
 * Nothing here needs more than one click.
 */
export default async function FrontDeskPage() {
  await requirePermission("appointments.read");

  const [summary, appointments, queue, settings] = await Promise.all([
    getTodaySummary(),
    getAppointmentsForDate(dateKey()),
    getQueue(),
    getSettings(),
  ]);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const waiting = queue.filter((q) => q.status !== "COMPLETED");

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Front Desk"
        description={today}
        actions={
          <>
            <ButtonLink href="/admin/clinic/patients/new" icon={<UserPlus />}>
              New Patient
            </ButtonLink>
            <ButtonLink href="/admin/clinic/appointments/new" variant="outline" icon={<CalendarPlus />}>
              Book
            </ButtonLink>
            <ButtonLink href="/admin/clinic/pos" variant="outline" icon={<Receipt />}>
              Sale
            </ButtonLink>
          </>
        }
      />

      {/* Today at a glance */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Booked" value={summary.total} icon={<CalendarPlus />} />
        <StatCard label="Confirmed" value={summary.confirmed} icon={<CheckCircle2 />} />
        <StatCard
          label="Waiting"
          value={summary.waiting}
          tone={summary.waiting > 3 ? "warning" : "neutral"}
          icon={<Clock />}
        />
        <StatCard label="In clinic" value={summary.checkedIn} icon={<Users />} />
        <StatCard label="Completed" value={summary.completed} tone="positive" icon={<CheckCircle2 />} />
        <StatCard label="Cancelled" value={summary.cancelled} icon={<XCircle />} />
        <StatCard
          label="No-shows"
          value={summary.noShows}
          tone={summary.noShows > 0 ? "warning" : "neutral"}
          icon={<XCircle />}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(summary.revenue, settings.currencySymbol, { compact: true })}
          tone="positive"
          icon={<Receipt />}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Today's appointments */}
        <div className="xl:col-span-2">
          <AdminSection
            title="Today's appointments"
            description={`${appointments.length} scheduled`}
            action={
              <Link
                href="/admin/clinic/appointments"
                className="text-xs text-ink-muted transition-colors hover:text-ink"
              >
                All appointments
              </Link>
            }
          >
            {appointments.length === 0 ? (
              <EmptyState
                icon={<CalendarPlus />}
                title="Nothing booked today"
                description="Book an appointment or add a walk-in to get started."
                action={
                  <ButtonLink href="/admin/clinic/appointments/new" size="sm">
                    Book an appointment
                  </ButtonLink>
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <TableWrap className="rounded-none border-0">
                    <Table>
                      <thead>
                        <tr>
                          <Th>Time</Th>
                          <Th>Patient</Th>
                          <Th>Treatment</Th>
                          <Th>Clinician</Th>
                          <Th>Status</Th>
                          <Th>Payment</Th>
                          <Th align="right">Actions</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appt) => (
                          <Tr key={appt.id}>
                            <Td className="whitespace-nowrap font-medium tabular-nums">
                              {formatTime(appt.startTime)}
                              <span className="block text-xs font-normal text-ink-subtle">
                                {appt.durationMinutes} min
                              </span>
                            </Td>
                            <Td>
                              <Link
                                href={`/admin/clinic/patients/${appt.patientId}`}
                                className="font-medium hover:underline"
                              >
                                {appt.patientName}
                              </Link>
                              <span className="block text-xs text-ink-subtle">
                                {appt.patientPhone}
                              </span>
                            </Td>
                            <Td className="text-ink-muted">{appt.serviceName}</Td>
                            <Td className="text-ink-muted">{appt.doctorName}</Td>
                            <Td>
                              <AppointmentStatusBadge status={appt.status} />
                            </Td>
                            <Td>
                              <Badge
                                tone={
                                  appt.paymentStatus === "Paid"
                                    ? "success"
                                    : appt.paymentStatus === "Partially Paid"
                                      ? "warning"
                                      : "neutral"
                                }
                              >
                                {appt.paymentStatus}
                              </Badge>
                            </Td>
                            <Td align="right">
                              <AppointmentRowActions
                                appointment={appt}
                                whatsappTemplate={`Hello ${appt.patientName}, this is ${settings.clinicName} confirming your appointment today at ${formatTime(appt.startTime)}.`}
                              />
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableWrap>
                </div>

                {/* Mobile / tablet cards */}
                <div className="md:hidden">
                  {appointments.map((appt) => (
                    <MobileRowCard
                      key={appt.id}
                      title={`${formatTime(appt.startTime)} · ${appt.patientName}`}
                      subtitle={`${appt.serviceName} · ${appt.doctorName}`}
                      meta={
                        <>
                          <AppointmentStatusBadge status={appt.status} />
                          <Badge tone={appt.paymentStatus === "Paid" ? "success" : "neutral"}>
                            {appt.paymentStatus}
                          </Badge>
                        </>
                      }
                      actions={
                        <AppointmentRowActions
                          appointment={appt}
                          whatsappTemplate={`Hello ${appt.patientName}, this is ${settings.clinicName} confirming your appointment today at ${formatTime(appt.startTime)}.`}
                        />
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </AdminSection>
        </div>

        {/* Live queue */}
        <div className="space-y-6">
          <AdminSection
            title="Waiting queue"
            description={`${waiting.length} in the clinic`}
            action={
              <Link
                href="/admin/clinic/queue"
                className="text-xs text-ink-muted transition-colors hover:text-ink"
              >
                Full queue
              </Link>
            }
          >
            {waiting.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="Queue is empty"
                description="Patients appear here when they are checked in."
              />
            ) : (
              <ul className="divide-y divide-line-subtle">
                {waiting
                  .sort((a, b) => a.token - b.token)
                  .map((entry) => (
                    <li key={entry.id} className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="grid size-8 shrink-0 place-items-center rounded-full bg-canvas-sunken font-display text-sm tabular-nums text-ink"
                        >
                          {entry.token}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {entry.patientName}
                            {entry.isWalkIn && (
                              <span className="ml-2 text-[0.625rem] uppercase tracking-[0.1em] text-champagne-500">
                                Walk-in
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-ink-subtle">
                            {entry.serviceName ?? "Consultation"} ·{" "}
                            {formatRelative(entry.checkedInAt)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <QueueStatusBadge status={entry.status} />
                            <QueueActions entry={entry} />
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </AdminSection>

          <AdminSection title="Quick actions">
            <div className="grid grid-cols-2 gap-px bg-line-subtle">
              <QuickAction href="/admin/clinic/patients/new" icon={<UserPlus />} label="New patient" />
              <QuickAction href="/admin/clinic/appointments/new" icon={<CalendarPlus />} label="Book" />
              <QuickAction href="/admin/clinic/queue" icon={<LogIn />} label="Check in" />
              <QuickAction href="/admin/clinic/pos" icon={<Receipt />} label="New sale" />
              <QuickAction href="/admin/clinic/patients" icon={<Search />} label="Find patient" />
              <QuickAction href="/admin/clinic/invoices" icon={<FileText />} label="Invoices" />
            </div>
          </AdminSection>
        </div>
      </div>
    </>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[4.5rem] flex-col items-center justify-center gap-2 bg-canvas-raised p-4 text-center transition-colors hover:bg-canvas-sunken"
    >
      <span aria-hidden="true" className="text-ink-muted [&>svg]:size-4">
        {icon}
      </span>
      <span className="text-xs text-ink">{label}</span>
    </Link>
  );
}
