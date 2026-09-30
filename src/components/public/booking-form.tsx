"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox, FormErrorSummary, Input, Select, Textarea } from "@/components/ui/form";
import { submitAppointmentRequest } from "@/server/actions/public";
import type { ActionResult } from "@/lib/action-result";
import type { Doctor, Service } from "@/types";

/** Kept in step with `appointment.maxAdvanceDays` in the clinic settings. */
const MAX_ADVANCE_DAYS = 90;

/** Fields that render their own inline error next to the input. */
const ATTRIBUTED_FIELDS = new Set([
  "fullName",
  "phone",
  "whatsapp",
  "email",
  "preferredDate",
  "message",
  "consent",
]);

/**
 * Errors for fields the visitor cannot see — the honeypot, or a field added to
 * the schema but not yet to this form. These have to be shown somewhere, or a
 * rejected submission looks identical to no submission at all.
 */
function unattributedErrors(state: ActionResult | null): string[] {
  if (!state || state.ok || !state.errors) return [];
  return Object.entries(state.errors)
    .filter(([field]) => !ATTRIBUTED_FIELDS.has(field))
    .map(([, message]) => message)
    .filter((m): m is string => Boolean(m));
}

/**
 * Public booking form.
 *
 * Deliberately submits a *request*, not a booking. The copy says so plainly
 * above the submit button, because a visitor who believes they hold a
 * confirmed slot and turns up is a worse outcome than one extra phone call.
 */
export function BookingForm({
  services,
  doctors,
  enabled,
}: {
  services: Service[];
  doctors: Doctor[];
  enabled: boolean;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    submitAppointmentRequest,
    null,
  );

  // The page is prerendered, so anything derived from the clock during render
  // would be the *build* date, not today's — and React keeps the server value
  // on hydration, so the bounds would never correct themselves. Setting them
  // after mount is the only way they stay true as the deployment ages.
  const [dateBounds, setDateBounds] = useState<{ min: string; max: string } | null>(null);

  useEffect(() => {
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    setDateBounds({
      min: iso(new Date()),
      max: iso(new Date(Date.now() + MAX_ADVANCE_DAYS * 86_400_000)),
    });
  }, []);

  if (state?.ok) {
    return (
      <div className="border border-success/25 bg-success-bg p-8 text-center sm:p-12">
        <CheckCircle2 className="mx-auto size-8 text-success" aria-hidden="true" />
        <h2 className="mt-5 font-display text-2xl text-ink">Request received</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
          {state.message}
        </p>
        <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-ink-subtle">
          If you need to be seen urgently, please call the clinic on 0337 5977799 rather than
          waiting for us to call you back.
        </p>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="border border-line-subtle bg-canvas-sunken p-8">
        <p className="font-display text-xl">Online booking is currently closed</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Please call us on 0337 5977799 or message us on WhatsApp and we will find you a time.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state?.message && !state.ok && (
        <div role="alert" className="border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger">
          {state.message}
        </div>
      )}

      {/* Anything the server rejected that no visible field owns. Without this
          the form would simply do nothing and the visitor would be left
          pressing the button. */}
      <FormErrorSummary errors={unattributedErrors(state)} />

      {/* Honeypot — visually hidden and removed from the tab order. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="fullName"
          label="Full name"
          required
          autoComplete="name"
          error={state?.errors?.fullName}
          className="sm:col-span-2"
        />
        <Input
          name="phone"
          label="Phone number"
          type="tel"
          required
          autoComplete="tel"
          placeholder="0300 1234567"
          error={state?.errors?.phone}
        />
        <Input
          name="whatsapp"
          label="WhatsApp number"
          type="tel"
          hint="Leave blank if the same as above"
          error={state?.errors?.whatsapp}
        />
        <Input
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          error={state?.errors?.email}
          className="sm:col-span-2"
        />
      </div>

      <div className="grid gap-5 border-t border-line-subtle pt-6 sm:grid-cols-2">
        <Select
          name="preferredServiceId"
          label="Treatment of interest"
          placeholder="Not sure — please advise"
          hint="If you are unsure, leave this and we will guide you"
          options={services.map((s) => ({ value: s.id, label: s.name }))}
        />
        <Select
          name="preferredDoctorId"
          label="Preferred clinician"
          placeholder="No preference"
          options={doctors.map((d) => ({ value: d.id, label: d.fullName }))}
        />
        <Input
          name="preferredDate"
          label="Preferred date"
          type="date"
          min={dateBounds?.min}
          max={dateBounds?.max}
          error={state?.errors?.preferredDate}
        />
        <Select
          name="preferredTime"
          label="Preferred time"
          placeholder="No preference"
          options={[
            { value: "Early afternoon (13:00 – 15:00)", label: "Early afternoon (13:00 – 15:00)" },
            { value: "Late afternoon (15:00 – 17:30)", label: "Late afternoon (15:00 – 17:30)" },
            { value: "Evening (17:30 – 20:00)", label: "Evening (17:30 – 20:00)" },
          ]}
        />
      </div>

      <Textarea
        name="message"
        label="Anything you would like us to know"
        rows={4}
        hint="Concerns, previous treatments, or questions. Please do not include sensitive medical details here — we will take a full history at consultation."
        error={state?.errors?.message}
      />

      <div className="border-t border-line-subtle pt-6">
        <Checkbox
          name="consent"
          label="I agree to be contacted by the clinic about this request."
          description="We will use your details only to arrange your appointment. See our Privacy Policy."
        />
        {state?.errors?.consent && (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {state.errors.consent}
          </p>
        )}
      </div>

      <div className="flex gap-3 border border-line-subtle bg-canvas-sunken p-4 text-xs leading-relaxed text-ink-muted">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-champagne-500" />
        <p>
          This is a <strong className="font-medium text-ink">request, not a confirmed booking</strong>. Our
          front desk will call you to confirm the clinician, the time and any preparation needed
          before your visit.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  // `useFormStatus` must be read from a child of the form element.
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" fullWidth loading={pending}>
      {pending ? "Sending request…" : "Request appointment"}
    </Button>
  );
}
