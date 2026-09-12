import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AppointmentForm } from "@/components/admin/appointment-form";
import { requirePermission } from "@/lib/auth/session";
import { getPatient, getPatients } from "@/lib/admin/queries";
import { getDoctors, getServices, getSettings } from "@/lib/cms/queries";
import { DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";

export const metadata = { title: "Book Appointment" };

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; date?: string }>;
}) {
  await requirePermission("appointments.write");

  const { patientId, date } = await searchParams;
  const [patients, doctors, services, settings, preselected] = await Promise.all([
    getPatients(200),
    getDoctors(),
    getServices(),
    getSettings(),
    patientId ? getPatient(patientId) : null,
  ]);

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Book an appointment"
        description="The clinician's diary is checked as the booking is written, so two people booking at once cannot double-book the same slot."
        breadcrumb={[
          { label: "Clinic", href: "/admin" },
          { label: "Appointments", href: "/admin/clinic/appointments" },
          { label: "Book" },
        ]}
      />

      <div className="max-w-3xl">
        <AppointmentForm
          patients={patients.map((p) => ({
            id: p.id,
            label: `${p.fullName} · ${p.phone}`,
          }))}
          doctors={doctors.map((d) => ({ id: d.id, name: d.fullName }))}
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
          }))}
          branchId={DEFAULT_BRANCH_ID}
          defaultPatientId={preselected?.id}
          defaultDate={date}
          slotMinutes={settings.appointment.slotMinutes}
        />
      </div>
    </>
  );
}
