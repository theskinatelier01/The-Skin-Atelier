import { CalendarClock, Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui/primitives";
import { AdminPageHeader, AdminSection } from "@/components/admin/admin-ui";
import { RequestCard } from "@/components/admin/request-card";
import { requirePermission } from "@/lib/auth/session";
import { getAppointmentRequests } from "@/lib/admin/queries";
import { getDoctors, getServices, getSettings } from "@/lib/cms/queries";

export const metadata = { title: "Booking Requests" };

/**
 * Website booking requests.
 *
 * A request is never an appointment. This screen exists so a person confirms
 * the slot, the clinician and any preparation with the patient before anything
 * is committed to the calendar.
 */
export default async function RequestsPage() {
  await requirePermission("appointments.write");

  const [requests, services, doctors, settings] = await Promise.all([
    getAppointmentRequests(),
    getServices(),
    getDoctors(),
    getSettings(),
  ]);

  const open = requests.filter((r) => r.status === "New" || r.status === "Contacted");
  const closed = requests.filter((r) => !["New", "Contacted"].includes(r.status));

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Booking Requests"
        description="Submitted through the website. Call the patient, agree a time, then confirm — this creates the patient record and the appointment together."
        breadcrumb={[{ label: "Clinic", href: "/admin" }, { label: "Booking Requests" }]}
      />

      <AdminSection
        title="Needs handling"
        description={`${open.length} open ${open.length === 1 ? "request" : "requests"}`}
      >
        {open.length === 0 ? (
          <EmptyState
            icon={<Inbox />}
            title="Nothing waiting"
            description="Requests submitted through the website booking form arrive here."
          />
        ) : (
          <ul className="divide-y divide-line-subtle">
            {open.map((request) => (
              <li key={request.id}>
                <RequestCard
                  request={request}
                  services={services}
                  doctors={doctors}
                  clinicName={settings.clinicName}
                  slotMinutes={settings.appointment.slotMinutes}
                />
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      {closed.length > 0 && (
        <div className="mt-6">
          <AdminSection title="Handled" description={`${closed.length} recent`}>
            <ul className="divide-y divide-line-subtle">
              {closed.slice(0, 20).map((request) => (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm"
                >
                  <CalendarClock aria-hidden="true" className="size-4 shrink-0 text-ink-subtle" />
                  <span className="font-medium text-ink">{request.fullName}</span>
                  <span className="text-ink-subtle">{request.phone}</span>
                  {request.preferredServiceName && (
                    <span className="text-ink-subtle">· {request.preferredServiceName}</span>
                  )}
                  <span className="ml-auto text-xs text-ink-subtle">{request.status}</span>
                </li>
              ))}
            </ul>
          </AdminSection>
        </div>
      )}
    </>
  );
}
