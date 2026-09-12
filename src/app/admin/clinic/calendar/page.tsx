import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { requirePermission } from "@/lib/auth/session";
import { getAppointmentsInRange } from "@/lib/admin/queries";
import { getDoctors, getSettings } from "@/lib/cms/queries";
import { dateKey, formatTime, timeToMinutes } from "@/lib/utils/format";

export const metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const STATUS_COLOUR: Record<string, string> = {
  Booked: "bg-canvas-sunken border-line text-ink",
  Confirmed: "bg-info-bg border-info/30 text-info",
  Arrived: "bg-ivory-300 border-champagne-300 text-gold-700",
  "In Consultation": "bg-ivory-300 border-champagne-300 text-gold-700",
  Treatment: "bg-ivory-300 border-champagne-300 text-gold-700",
  Completed: "bg-success-bg border-success/30 text-success",
  Cancelled: "bg-canvas-sunken border-line text-ink-subtle line-through",
  "No Show": "bg-danger-bg border-danger/30 text-danger",
};

/**
 * Day calendar.
 *
 * A column per clinician against a shared time axis, which is the view a front
 * desk actually needs: it answers who is free at 3pm without arithmetic.
 */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requirePermission("appointments.read");

  const { date } = await searchParams;
  const day = date ?? dateKey();

  const [appointments, doctors, settings] = await Promise.all([
    getAppointmentsInRange(day, day),
    getDoctors(),
    getSettings(),
  ]);

  const dayOfWeek = new Date(`${day}T00:00:00`).getDay();
  const hours = settings.openingHours.find((h) => h.day === dayOfWeek);
  const openMinutes = hours && !hours.closed ? timeToMinutes(hours.open) : 11 * 60;
  const closeMinutes = hours && !hours.closed ? timeToMinutes(hours.close) : 20 * 60;
  const totalMinutes = Math.max(closeMinutes - openMinutes, 60);

  const slots = Array.from(
    { length: Math.ceil(totalMinutes / 60) + 1 },
    (_, i) => openMinutes + i * 60,
  );

  const previousDay = dateKey(new Date(new Date(`${day}T00:00:00`).getTime() - 86_400_000));
  const nextDay = dateKey(new Date(new Date(`${day}T00:00:00`).getTime() + 86_400_000));

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Calendar"
        description={new Date(`${day}T00:00:00`).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Calendar" }]}
        actions={
          <>
            <ButtonLink href={`/admin/clinic/calendar?date=${previousDay}`} variant="outline" size="sm">
              Previous
            </ButtonLink>
            <ButtonLink href="/admin/clinic/calendar" variant="outline" size="sm">
              Today
            </ButtonLink>
            <ButtonLink href={`/admin/clinic/calendar?date=${nextDay}`} variant="outline" size="sm">
              Next
            </ButtonLink>
            <ButtonLink href={`/admin/clinic/appointments/new?date=${day}`}>Book</ButtonLink>
          </>
        }
      />

      <AdminSection
        title="Day view"
        description={
          hours && !hours.closed
            ? `Clinic open ${hours.open} to ${hours.close} · ${appointments.length} appointments`
            : "The clinic is closed on this day"
        }
      >
        <div
          className="w-full overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Appointment calendar"
        >
          <div className="flex min-w-max">
            {/* Time axis */}
            <div className="w-16 shrink-0 border-r border-line-subtle">
              <div className="h-10 border-b border-line-subtle" />
              {slots.map((minutes) => (
                <div
                  key={minutes}
                  className="relative h-20 border-b border-line-subtle text-right"
                >
                  <span className="absolute -top-2 right-2 bg-canvas-raised px-1 text-[0.625rem] tabular-nums text-ink-subtle">
                    {formatTime(
                      `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* One column per clinician */}
            {doctors.map((doctor) => {
              const forDoctor = appointments.filter((a) => a.doctorId === doctor.id);
              return (
                <div key={doctor.id} className="w-56 shrink-0 border-r border-line-subtle last:border-r-0">
                  <div className="flex h-10 items-center justify-between gap-2 border-b border-line-subtle bg-canvas-sunken px-3">
                    <span className="truncate text-xs font-medium text-ink">{doctor.fullName}</span>
                    <span className="shrink-0 text-[0.625rem] tabular-nums text-ink-subtle">
                      {forDoctor.length}
                    </span>
                  </div>

                  <div className="relative" style={{ height: `${slots.length * 5}rem` }}>
                    {slots.map((minutes) => (
                      <div
                        key={minutes}
                        className="h-20 border-b border-line-subtle"
                        aria-hidden="true"
                      />
                    ))}

                    {forDoctor.map((appointment) => {
                      const start = timeToMinutes(appointment.startTime);
                      const top = ((start - openMinutes) / 60) * 5;
                      const height = Math.max((appointment.durationMinutes / 60) * 5, 1.5);

                      return (
                        <Link
                          key={appointment.id}
                          href={`/admin/clinic/patients/${appointment.patientId}`}
                          style={{ top: `${top}rem`, height: `${height}rem` }}
                          className={`absolute inset-x-1 overflow-hidden rounded-sm border px-2 py-1 text-[0.6875rem] leading-tight transition-shadow hover:shadow-card ${
                            STATUS_COLOUR[appointment.status] ?? STATUS_COLOUR.Booked
                          }`}
                        >
                          <span className="block truncate font-medium">
                            {formatTime(appointment.startTime)} {appointment.patientName}
                          </span>
                          <span className="block truncate opacity-75">
                            {appointment.serviceName}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {appointments.length === 0 && (
          <p className="flex items-center justify-center gap-2 border-t border-line-subtle py-8 text-sm text-ink-subtle">
            <CalendarDays className="size-4" aria-hidden="true" />
            Nothing booked on this day.
          </p>
        )}
      </AdminSection>
    </>
  );
}
