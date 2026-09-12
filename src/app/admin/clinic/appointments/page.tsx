import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AdminPageHeader, AdminSection, AppointmentStatusBadge } from "@/components/admin/admin-ui";
import { DateRangeTabs } from "@/components/admin/date-range-tabs";
import { requirePermission } from "@/lib/auth/session";
import { getAppointmentsInRange } from "@/lib/admin/queries";
import { dateKey, formatTime } from "@/lib/utils/format";

export const metadata = { title: "Appointments" };

/**
 * Appointment register.
 *
 * Defaults to the coming week rather than "everything", because an unbounded
 * list of a clinic's history is never the thing anyone actually wants.
 */
export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
}) {
  await requirePermission("appointments.read");

  const params = await searchParams;
  const from = params.from ?? dateKey();
  const to = params.to ?? dateKey(new Date(Date.now() + 7 * 86_400_000));

  let appointments = await getAppointmentsInRange(from, to);
  if (params.status) appointments = appointments.filter((a) => a.status === params.status);

  // Group by day so the register reads as a schedule, not a flat list.
  const byDate = appointments.reduce<Record<string, typeof appointments>>((acc, appt) => {
    (acc[appt.date] ??= []).push(appt);
    return acc;
  }, {});

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Appointments"
        description={`${appointments.length} between ${from} and ${to}`}
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Appointments" }]}
        actions={
          <>
            <ButtonLink href="/admin/clinic/calendar" variant="outline">
              Calendar view
            </ButtonLink>
            <ButtonLink href="/admin/clinic/appointments/new" icon={<CalendarPlus />}>
              Book appointment
            </ButtonLink>
          </>
        }
      />

      <DateRangeTabs basePath="/admin/clinic/appointments" from={from} to={to} />

      <div className="mt-5 space-y-5">
        {Object.keys(byDate).length === 0 ? (
          <AdminSection title="No appointments">
            <EmptyState
              icon={<CalendarPlus />}
              title="Nothing in this range"
              description="Try a wider date range, or book a new appointment."
              action={
                <ButtonLink href="/admin/clinic/appointments/new" size="sm">
                  Book appointment
                </ButtonLink>
              }
            />
          </AdminSection>
        ) : (
          Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, items]) => (
              <AdminSection
                key={date}
                title={new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                description={`${items.length} appointment${items.length === 1 ? "" : "s"}`}
              >
                <TableWrap className="rounded-none border-0">
                  <Table>
                    <thead>
                      <tr>
                        <Th>Time</Th>
                        <Th>Patient</Th>
                        <Th>Treatment</Th>
                        <Th>Clinician</Th>
                        <Th>Source</Th>
                        <Th>Status</Th>
                        <Th>Payment</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((appt) => (
                        <Tr key={appt.id}>
                          <Td className="whitespace-nowrap tabular-nums">
                            {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
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
                            <Badge tone="neutral">{appt.source}</Badge>
                          </Td>
                          <Td>
                            <AppointmentStatusBadge status={appt.status} />
                          </Td>
                          <Td>
                            <Badge tone={appt.paymentStatus === "Paid" ? "success" : "neutral"}>
                              {appt.paymentStatus}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </AdminSection>
            ))
        )}
      </div>
    </>
  );
}
