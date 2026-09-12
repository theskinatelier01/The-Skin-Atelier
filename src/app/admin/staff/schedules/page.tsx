import { notFound } from "next/navigation";
import { CalendarRange } from "lucide-react";

import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { getAuthContext } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getDoctors, getSettings } from "@/lib/cms/queries";

export const metadata = { title: "Schedules" };
export const dynamic = "force-dynamic";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INDEX = [1, 2, 3, 4, 5, 6, 0];

/**
 * Clinician availability.
 *
 * Shown against the clinic opening hours, because a doctor cannot be available
 * when the clinic is shut, and the booking form needs both to offer a slot.
 */
export default async function SchedulesPage() {
  const ctx = await getAuthContext();
  if (!ctx || !hasPermission(ctx, "schedules.write")) notFound();

  const [doctors, settings] = await Promise.all([getDoctors(), getSettings()]);

  return (
    <>
      <AdminPageHeader
        title="Schedules"
        description="Working days and clinic hours. The booking system will not offer a slot outside these times."
        breadcrumb={[{ label: "Staff", href: "/admin" }, { label: "Schedules" }]}
      />

      <AdminSection title="Clinic opening hours" description="Applies to every clinician">
        <div className="w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Opening hours">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className="border-b border-line bg-canvas-sunken px-4 py-3 text-left text-[0.625rem] uppercase tracking-[0.1em] text-ink-muted">
                  Day
                </th>
                <th scope="col" className="border-b border-line bg-canvas-sunken px-4 py-3 text-left text-[0.625rem] uppercase tracking-[0.1em] text-ink-muted">
                  Hours
                </th>
              </tr>
            </thead>
            <tbody>
              {DAY_INDEX.map((dayIndex, i) => {
                const hours = settings.openingHours.find((h) => h.day === dayIndex);
                return (
                  <tr key={dayIndex} className="border-b border-line-subtle last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal text-ink">
                      {DAYS[i]}
                    </th>
                    <td className="px-4 py-2.5 tabular-nums text-ink-muted">
                      {hours && !hours.closed ? `${hours.open} – ${hours.close}` : "Closed"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminSection>

      <div className="mt-5">
        <AdminSection
          title="Clinician availability"
          description={`${doctors.length} clinicians · ${settings.appointment.slotMinutes} minute slots`}
        >
          <ul className="divide-y divide-line-subtle">
            {doctors.map((doctor) => (
              <li key={doctor.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{doctor.fullName}</p>
                  <p className="mt-0.5 text-xs text-ink-subtle">{doctor.title}</p>
                </div>
                <div className="flex gap-1.5">
                  {DAYS.map((day, i) => {
                    const hours = settings.openingHours.find((h) => h.day === DAY_INDEX[i]);
                    const open = hours && !hours.closed;
                    return (
                      <span
                        key={day}
                        title={open ? `${day}: ${hours.open} to ${hours.close}` : `${day}: closed`}
                        className={
                          open
                            ? "grid size-8 place-items-center rounded-sm bg-charcoal-900 text-[0.625rem] font-medium text-ivory-100"
                            : "grid size-8 place-items-center rounded-sm bg-canvas-sunken text-[0.625rem] text-ink-subtle"
                        }
                      >
                        {day.slice(0, 1)}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>

          <p className="border-t border-line-subtle px-5 py-4 text-xs leading-relaxed text-ink-muted">
            <CalendarRange className="mr-1.5 inline size-3.5" aria-hidden="true" />
            Per-clinician overrides, breaks and leave are stored on the doctorSchedules collection
            and are respected by the conflict check when an appointment is booked.
          </p>
        </AdminSection>
      </div>
    </>
  );
}
