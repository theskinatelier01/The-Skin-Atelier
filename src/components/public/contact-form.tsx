"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox, Input, Textarea } from "@/components/ui/form";
import { submitContactEnquiry } from "@/server/actions/public";
import type { ActionResult } from "@/lib/action-result";

export function ContactForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    submitContactEnquiry,
    null,
  );

  if (state?.ok) {
    return (
      <div className="border border-success/25 bg-success-bg p-8 text-center">
        <CheckCircle2 className="mx-auto size-7 text-success" aria-hidden="true" />
        <p className="mt-4 font-display text-xl text-ink">Message sent</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.message && !state.ok && (
        <div role="alert" className="border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger">
          {state.message}
        </div>
      )}

      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="fullName"
          label="Full name"
          required
          autoComplete="name"
          error={state?.errors?.fullName}
        />
        <Input
          name="phone"
          label="Phone number"
          type="tel"
          required
          autoComplete="tel"
          error={state?.errors?.phone}
        />
      </div>

      <Input
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        error={state?.errors?.email}
      />
      <Input name="subject" label="Subject" error={state?.errors?.subject} />
      <Textarea
        name="message"
        label="Your message"
        required
        rows={5}
        hint="Please do not include sensitive medical details — we will take a full history at consultation."
        error={state?.errors?.message}
      />

      <div className="border-t border-line-subtle pt-5">
        <Checkbox
          name="consent"
          label="I agree to be contacted about this enquiry."
          description="Your details are used only to respond to you."
        />
        {state?.errors?.consent && (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {state.errors.consent}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" fullWidth loading={pending}>
      {pending ? "Sending…" : "Send message"}
    </Button>
  );
}
