import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PatientForm } from "@/components/admin/patient-form";
import { requirePermission } from "@/lib/auth/session";
import { DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";

export const metadata = { title: "New Patient" };

export default async function NewPatientPage() {
  await requirePermission("patients.write");

  return (
    <>
      <AdminPageHeader
        domain="clinic"
        title="Register a patient"
        description="Contact details only. Clinical history is recorded by a clinician at the first consultation."
        breadcrumb={[
          { label: "Clinic", href: "/admin" },
          { label: "Patients", href: "/admin/clinic/patients" },
          { label: "New" },
        ]}
      />

      <div className="max-w-3xl">
        <PatientForm branchId={DEFAULT_BRANCH_ID} />
      </div>
    </>
  );
}
