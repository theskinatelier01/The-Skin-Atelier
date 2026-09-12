"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { createAppointment } from "@/server/actions/clinic";
import { addMinutesToTime, dateKey } from "@/lib/utils/format";
import { APPOINTMENT_STATUSES, PATIENT_SOURCES } from "@/types";
import type { ActionResult } from "@/lib/action-result";

type Result = ActionResult & { appointmentId?: string };

export function AppointmentForm({
  patients,
  doctors,
  services,
  branchId,
  defaultPatientId,
  defaultDate,
  slotMinutes,
}: {
  patients: { id: string; label: string }[];
  doctors: { id: string; name: string }[];
  services: { id: string; name: string; durationMinutes: number }[];
  branchId: string;
  defaultPatientId?: string;
  defaultDate?: string;
  slotMinutes: number;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<Result | null, FormData>(createAppointment, null);

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [duration, setDuration] = useState(services[0]?.durationMinutes ?? slotMinutes);
  const [startTime, setStartTime] = useState("11:00");

  // Choosing a treatment sets its standard duration; the receptionist can still
  // override it for a longer visit.
  useEffect(() => {
    const service = services.find((s) => s.id === serviceId);
    if (service) setDuration(service.durationMinutes);
  }, [serviceId, services]);

  useEffect(() => {
    if (state?.ok) router.push("/admin/clinic/front-desk");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="branchId" value={branchId} />

      {state?.message && !state.ok && (
        <div
          role="alert"
          className="flex gap-3 rounded-sm border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}

      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Who and what</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Select
            name="patientId"
            label="Patient"
            required
            defaultValue={defaultPatientId}
            placeholder="Select a patient"
            options={patients.map((p) => ({ value: p.id, label: p.label }))}
            hint="Register the patient first if they are new"
            error={state?.errors?.patientId}
            className="sm:col-span-2"
          />
          <Select
            name="serviceId"
            label="Treatment"
            required
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            options={services.map((s) => ({ value: s.id, label: s.name }))}
            error={state?.errors?.serviceId}
          />
          <Select
            name="doctorId"
            label="Clinician"
            required
            placeholder="Select a clinician"
            options={doctors.map((d) => ({ value: d.id, label: d.name }))}
            error={state?.errors?.doctorId}
          />
        </div>
      </section>

      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">When</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Input
            name="date"
            label="Date"
            type="date"
            required
            defaultValue={defaultDate ?? dateKey()}
            min={dateKey(new Date(Date.now() - 86_400_000))}
            error={state?.errors?.date}
          />
          <Input
            name="startTime"
            label="Start time"
            type="time"
            required
            step={300}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            error={state?.errors?.startTime}
          />
          <Input
            name="durationMinutes"
            label="Duration (minutes)"
            type="number"
            required
            min={5}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            hint={`Ends at ${addMinutesToTime(startTime, duration)}`}
            error={state?.errors?.durationMinutes}
          />
        </div>
      </section>

      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Select
            name="appointmentType"
            label="Type"
            defaultValue="Consultation"
            options={["Consultation", "Treatment", "Follow-up", "Package Session"].map((t) => ({
              value: t,
              label: t,
            }))}
          />
          <Select
            name="status"
            label="Status"
            defaultValue="Confirmed"
            options={APPOINTMENT_STATUSES.filter(
              (s) => !["Completed", "Cancelled", "No Show"].includes(s),
            ).map((s) => ({ value: s, label: s }))}
          />
          <Select
            name="source"
            label="Booked via"
            defaultValue="Phone"
            options={PATIENT_SOURCES.map((s) => ({ value: s, label: s }))}
          />
          <Textarea
            name="notes"
            label="Notes for the clinician"
            rows={3}
            className="sm:col-span-3"
            hint="Operational notes only — clinical history belongs in the consultation record"
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Booking…" : "Book appointment"}
    </Button>
  );
}
