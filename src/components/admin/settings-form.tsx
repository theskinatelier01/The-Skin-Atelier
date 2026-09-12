"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/form";
import { saveSettings } from "@/server/actions/cms";
import type { ClinicSettings } from "@/types";
import type { ActionResult } from "@/lib/action-result";

/**
 * Clinic settings.
 *
 * These values feed the public site header and footer, the schema.org markup,
 * invoice numbering and the WhatsApp links, so saving revalidates every public
 * route rather than a single page.
 */
export function SettingsForm({ settings }: { settings: ClinicSettings }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveSettings, null);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state?.message && (
        <div
          role="status"
          className={`flex gap-2.5 rounded-sm border px-4 py-3 text-sm ${
            state.ok
              ? "border-success/25 bg-success-bg text-success"
              : "border-danger/25 bg-danger-bg text-danger"
          }`}
        >
          {state.ok && <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          {state.message}
        </div>
      )}

      <Section title="Identity" description="Shown across the website and on every invoice.">
        <Input
          name="clinicName"
          label="Clinic name"
          required
          defaultValue={settings.clinicName}
          error={state?.errors?.clinicName}
        />
        <Input name="tagline" label="Tagline" defaultValue={settings.tagline} />
      </Section>

      <Section title="Contact" description="Used in the header, footer, schema markup and WhatsApp links.">
        <Input
          name="phone"
          label="Phone"
          required
          defaultValue={settings.phone}
          error={state?.errors?.phone}
        />
        <Input
          name="whatsapp"
          label="WhatsApp number"
          required
          defaultValue={settings.whatsapp}
          hint="Digits only, no spaces. The country code is added automatically."
          error={state?.errors?.whatsapp}
        />
        <Input
          name="email"
          label="Email"
          type="email"
          required
          defaultValue={settings.email}
          error={state?.errors?.email}
        />
        <Input
          name="googleMapsUrl"
          label="Google Maps link"
          defaultValue={settings.googleMapsUrl}
          error={state?.errors?.googleMapsUrl}
        />
      </Section>

      <Section title="Address">
        <Input
          name="addressLine"
          label="Address"
          required
          defaultValue={settings.addressLine}
          error={state?.errors?.addressLine}
          className="sm:col-span-2"
        />
        <Input name="city" label="City" required defaultValue={settings.city} />
        <Input name="country" label="Country" required defaultValue={settings.country} />
      </Section>

      <Section
        title="Reputation"
        description="Only enter figures you can evidence. These are published as structured data and must be accurate."
      >
        <Input
          name="googleRating"
          label="Google rating"
          type="number"
          step="0.1"
          min={0}
          max={5}
          defaultValue={settings.googleRating}
        />
        <Input
          name="googleReviewCount"
          label="Number of reviews"
          type="number"
          min={0}
          defaultValue={settings.googleReviewCount}
        />
      </Section>

      <Section title="Billing" description="Applied to new invoices and patient records.">
        <Input name="currency" label="Currency code" required defaultValue={settings.currency} />
        <Input
          name="currencySymbol"
          label="Currency symbol"
          required
          defaultValue={settings.currencySymbol}
        />
        <Input
          name="taxPercent"
          label="Tax percent"
          type="number"
          step="0.01"
          min={0}
          max={100}
          defaultValue={settings.taxPercent}
          hint="Applied to retail product lines at the till"
        />
        <Input
          name="invoicePrefix"
          label="Invoice prefix"
          required
          defaultValue={settings.invoicePrefix}
          hint="Existing invoice numbers are not renumbered"
        />
        <Input
          name="patientCodePrefix"
          label="Patient code prefix"
          required
          defaultValue={settings.patientCodePrefix}
        />
      </Section>

      <Section title="Website behaviour">
        <div className="sm:col-span-2">
          <Checkbox
            name="onlineBookingEnabled"
            defaultChecked={settings.onlineBookingEnabled}
            label="Accept booking requests through the website"
            description="When off, the booking form is replaced with the phone number and WhatsApp link."
          />
          <Checkbox
            name="announcementEnabled"
            defaultChecked={settings.announcementBar?.enabled}
            label="Show the announcement bar"
            description="A thin strip above the site header."
          />
        </div>
        <Input
          name="announcementText"
          label="Announcement text"
          defaultValue={settings.announcementBar?.text}
        />
        <Input
          name="announcementHref"
          label="Announcement link"
          defaultValue={settings.announcementBar?.href}
          placeholder="/book"
        />
      </Section>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-xs leading-relaxed text-ink-subtle">{description}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending}>
      {pending ? "Saving…" : "Save settings"}
    </Button>
  );
}
