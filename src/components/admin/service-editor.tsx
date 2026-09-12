"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { saveService } from "@/server/actions/cms";
import { slugify } from "@/lib/utils/format";
import { SKIN_CONCERNS, type Service, type ServiceCategory } from "@/types";
import type { ActionResult } from "@/lib/action-result";

type Result = ActionResult & { serviceId?: string };

/**
 * Treatment editor.
 *
 * List fields are edited as one-per-line textareas rather than repeatable rows:
 * for a clinic editing benefit copy, typing a list is faster than managing a
 * set of add/remove controls, and it pastes cleanly from a document.
 */
export function ServiceEditor({
  service,
  categories,
}: {
  service?: Service;
  categories: ServiceCategory[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<Result | null, FormData>(saveService, null);

  const [name, setName] = useState(service?.name ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(service?.slug));
  const [categoryId, setCategoryId] = useState(service?.categoryId ?? categories[0]?.id ?? "");
  const [onConsultation, setOnConsultation] = useState(service?.priceOnConsultation ?? false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (state?.ok) router.push("/admin/website/services");
  }, [state, router]);

  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {service && <input type="hidden" name="id" value={service.id} />}
      <input type="hidden" name="categoryName" value={categoryName} />

      {state?.message && !state.ok && (
        <div
          role="alert"
          className="rounded-sm border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </div>
      )}

      {/* Identity */}
      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Identity</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input
            name="name"
            label="Treatment name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={state?.errors?.name}
          />
          <Input
            name="slug"
            label="URL"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            leading="/services/"
            hint="Changing this breaks existing links and search rankings"
            error={state?.errors?.slug}
          />
          <Select
            name="categoryId"
            label="Category"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            error={state?.errors?.categoryId}
          />
          <Input
            name="displayOrder"
            label="Display order"
            type="number"
            min={0}
            defaultValue={service?.displayOrder ?? 0}
            hint="Lower numbers appear first"
          />
          <Textarea
            name="shortDescription"
            label="Short description"
            required
            rows={2}
            defaultValue={service?.shortDescription}
            hint="Shown on cards and in search results. One or two sentences."
            error={state?.errors?.shortDescription}
            className="sm:col-span-2"
          />
          <Textarea
            name="detailedDescription"
            label="Full description"
            rows={8}
            defaultValue={service?.detailedDescription}
            hint="Separate paragraphs with a blank line."
            className="sm:col-span-2"
          />
        </div>
      </section>

      {/* Clinical detail */}
      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Clinical detail</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input
            name="durationMinutes"
            label="Duration (minutes)"
            type="number"
            required
            min={5}
            step={5}
            defaultValue={service?.durationMinutes ?? 30}
            error={state?.errors?.durationMinutes}
          />
          <Input
            name="recommendedSessions"
            label="Recommended sessions"
            defaultValue={service?.recommendedSessions}
            placeholder="A course of 3–6 sessions, 4 weeks apart"
          />
          <Input
            name="downtime"
            label="Downtime"
            defaultValue={service?.downtime}
            placeholder="None. Mild redness settles within an hour."
          />
          <Input
            name="resultsTimeline"
            label="Results timeline"
            defaultValue={service?.resultsTimeline}
            placeholder="Begins at 3–5 days, full effect at 2 weeks."
          />
          <Textarea
            name="benefits"
            label="Benefits"
            rows={5}
            defaultValue={service?.benefits.join("\n")}
            hint="One per line"
          />
          <Textarea
            name="suitableFor"
            label="Suitable for"
            rows={5}
            defaultValue={service?.suitableFor.join("\n")}
            hint="One per line"
          />
        </div>

        <div className="mt-5 flex gap-3 rounded-sm border border-line-subtle bg-canvas-sunken p-3.5">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-champagne-500" />
          <p className="text-xs leading-relaxed text-ink-muted">
            Describe what a treatment typically does, not what it will do for a specific person.
            Avoid guarantees — the website already carries the standard wording that results vary
            from person to person and that suitability is determined at consultation.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Pricing</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Input
            name="price"
            label="Price"
            type="number"
            min={0}
            defaultValue={service?.price ?? ""}
            disabled={onConsultation}
            hint="Shown as a starting price"
          />
          <Input
            name="discountedPrice"
            label="Discounted price"
            type="number"
            min={0}
            defaultValue={service?.discountedPrice ?? ""}
            disabled={onConsultation}
            hint="Leave blank if not discounted"
          />
          <div className="sm:col-span-2">
            <Checkbox
              name="priceOnConsultation"
              checked={onConsultation}
              onChange={(e) => setOnConsultation(e.target.checked)}
              label="Price on consultation"
              description="Use this where the plan and cost genuinely depend on assessment. The website will say so rather than showing a figure."
            />
          </div>
        </div>
      </section>

      {/* Concerns */}
      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Concerns addressed</h2>
        <p className="mt-1 text-xs text-ink-subtle">
          Drives the &ldquo;what are you looking to improve?&rdquo; finder on the homepage.
        </p>
        <div className="mt-4 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {SKIN_CONCERNS.map((concern) => (
            <Checkbox
              key={concern}
              name="concernTags"
              value={concern}
              defaultChecked={service?.concernTags?.includes(concern)}
              label={concern}
            />
          ))}
        </div>
      </section>

      {/* Visibility & SEO */}
      <section className="rounded-md border border-line-subtle bg-canvas-raised p-6">
        <h2 className="text-sm font-semibold text-ink">Visibility &amp; SEO</h2>
        <div className="mt-5 space-y-1">
          <Checkbox
            name="isActive"
            defaultChecked={service?.isActive ?? true}
            label="Published"
            description="Unpublishing removes it from the website immediately."
          />
          <Checkbox
            name="showInCategory"
            defaultChecked={service?.showInCategory ?? true}
            label="Show in its category on the treatments page"
          />
          <Checkbox
            name="showOnHomepage"
            defaultChecked={service?.showOnHomepage ?? false}
            label="Show on the homepage"
          />
          <Checkbox
            name="isFeatured"
            defaultChecked={service?.isFeatured ?? false}
            label="Signature treatment"
            description="Adds a badge and makes it eligible for the featured editorial section."
          />
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Input
            name="coverImageUrl"
            label="Cover image URL"
            defaultValue={service?.coverImageUrl}
            hint="Paste a URL from the media library"
            className="sm:col-span-2"
          />
          <Input
            name="seoTitle"
            label="SEO title"
            maxLength={70}
            defaultValue={service?.seo?.title}
            hint="Up to 70 characters. Include the treatment and Islamabad."
          />
          <Input
            name="seoDescription"
            label="SEO description"
            maxLength={180}
            defaultValue={service?.seo?.description}
            hint="Up to 180 characters."
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton isEdit={Boolean(service)} />
      </div>
    </form>
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Saving…" : isEdit ? "Save and publish" : "Create treatment"}
    </Button>
  );
}
