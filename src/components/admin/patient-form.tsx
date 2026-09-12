"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { createPatient } from "@/server/actions/clinic";
import { PATIENT_SOURCES } from "@/types";
import type { ActionResult } from "@/lib/action-result";

type Result = ActionResult & { patientId?: string };

/**
 * Patient registration.
 *
 * Deliberately contains no clinical fields — allergies, history and
 * contraindications live in a separate, clinician-only record, so a
 * receptionist registering a walk-in never handles medical data.
 */
export function PatientForm({ branchId }: { branchId: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState<Result | null, FormData>(createPatient, null);

  useEffect(() => {
    if (state?.ok && state.patientId) {
      router.push(`/admin/clinic/patients/${state.patientId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="branchId" value={branchId} />

      {state?.message && !state.ok && (
        <div
          role="alert"
          className="rounded-sm border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          {state.message}
          {state.patientId && (
            <Link
              href={`/admin/clinic/patients/${state.patientId}`}
              className="ml-2 font-medium underline"
            >
              Open the existing record
            </Link>
          )}
        </div>
      )}

      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Identity</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input
            name="fullName"
            label="Full name"
            required
            autoFocus
            error={state?.errors?.fullName}
            className="sm:col-span-2"
          />
          <Select
            name="gender"
            label="Gender"
            required
            defaultValue="Female"
            options={["Female", "Male", "Other", "Prefer not to say"].map((g) => ({
              value: g,
              label: g,
            }))}
            error={state?.errors?.gender}
          />
          <Input
            name="dateOfBirth"
            label="Date of birth"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            hint="Used to check suitability for some treatments"
            error={state?.errors?.dateOfBirth}
          />
        </div>
      </section>

      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Contact</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input
            name="phone"
            label="Phone number"
            type="tel"
            required
            placeholder="0300 1234567"
            hint="Used to detect an existing record"
            error={state?.errors?.phone}
          />
          <Input
            name="whatsapp"
            label="WhatsApp"
            type="tel"
            hint="Leave blank if the same as the phone number"
            error={state?.errors?.whatsapp}
          />
          <Input name="email" label="Email" type="email" error={state?.errors?.email} />
          <Input name="city" label="City" defaultValue="Islamabad" error={state?.errors?.city} />
          <Textarea
            name="address"
            label="Address"
            rows={2}
            className="sm:col-span-2"
            error={state?.errors?.address}
          />
        </div>
      </section>

      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Emergency contact &amp; source</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input
            name="emergencyContactName"
            label="Emergency contact name"
            error={state?.errors?.emergencyContactName}
          />
          <Input
            name="emergencyContactPhone"
            label="Emergency contact phone"
            type="tel"
            error={state?.errors?.emergencyContactPhone}
          />
          <Select
            name="source"
            label="How did they hear about us?"
            required
            defaultValue="Walk-in"
            options={PATIENT_SOURCES.map((s) => ({ value: s, label: s }))}
            hint="Feeds the marketing attribution report"
            error={state?.errors?.source}
          />
        </div>
      </section>

      <div className="flex gap-3 rounded-sm border border-line-subtle bg-canvas-sunken p-4 text-xs leading-relaxed text-ink-muted">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-champagne-500" />
        <p>
          Creating this record is logged against your account. Patient data is confidential and must
          not be shared outside the clinic.
        </p>
      </div>

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
      {pending ? "Registering…" : "Register patient"}
    </Button>
  );
}
