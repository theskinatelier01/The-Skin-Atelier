"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, MessageCircle, Phone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { Input, Select } from "@/components/ui/form";
import { confirmBookingRequest, updateRequestStatus } from "@/server/actions/clinic";
import { dateKey, formatRelative, whatsappLink } from "@/lib/utils/format";
import type { AppointmentRequest, Doctor, Service } from "@/types";

/**
 * One website booking request, with the confirmation form inline.
 *
 * The form is collapsed until the receptionist chooses to confirm, so the list
 * stays scannable while a dozen requests are open.
 */
export function RequestCard({
  request,
  services,
  doctors,
  clinicName,
  slotMinutes,
}: {
  request: AppointmentRequest;
  services: Service[];
  doctors: Doctor[];
  clinicName: string;
  slotMinutes: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    doctorId: request.preferredDoctorId ?? doctors[0]?.id ?? "",
    serviceId: request.preferredServiceId ?? services[0]?.id ?? "",
    date: request.preferredDate || dateKey(),
    startTime: "11:00",
    durationMinutes: slotMinutes,
  });

  function confirm() {
    setMessage(null);
    startTransition(async () => {
      const result = await confirmBookingRequest(request.id, form);
      setMessage(result.message ?? null);
      if (result.ok) {
        setExpanded(false);
        router.refresh();
      }
    });
  }

  function setStatus(status: "Contacted" | "Declined") {
    startTransition(async () => {
      const result = await updateRequestStatus(request.id, status);
      setMessage(result.message ?? null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-medium text-ink">{request.fullName}</p>
            <Badge tone={request.status === "New" ? "info" : "neutral"}>{request.status}</Badge>
            <span className="text-xs text-ink-subtle">{formatRelative(request.createdAt)}</span>
          </div>

          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[0.8125rem] text-ink-muted">
            <div className="flex gap-1.5">
              <dt className="sr-only">Phone</dt>
              <dd>{request.phone}</dd>
            </div>
            {request.email && (
              <div className="flex gap-1.5">
                <dt className="sr-only">Email</dt>
                <dd>{request.email}</dd>
              </div>
            )}
            {request.preferredServiceName && (
              <div className="flex gap-1.5">
                <dt className="text-ink-subtle">Wants:</dt>
                <dd className="text-ink">{request.preferredServiceName}</dd>
              </div>
            )}
            {request.preferredDate && (
              <div className="flex gap-1.5">
                <dt className="text-ink-subtle">Prefers:</dt>
                <dd className="text-ink">
                  {request.preferredDate}
                  {request.preferredTime ? ` · ${request.preferredTime}` : ""}
                </dd>
              </div>
            )}
          </dl>

          {request.message && (
            <p className="mt-3 max-w-2xl border-l-2 border-line pl-3 text-[0.8125rem] leading-relaxed text-ink-muted">
              {request.message}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <a
            href={`tel:${request.phone.replace(/\s/g, "")}`}
            aria-label={`Call ${request.fullName}`}
            className="grid size-9 place-items-center rounded-sm border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink"
          >
            <Phone className="size-4" aria-hidden="true" />
          </a>
          <a
            href={whatsappLink(
              request.whatsapp ?? request.phone,
              `Hello ${request.fullName}, this is ${clinicName}. Thank you for your booking request — may I confirm a time with you?`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${request.fullName}`}
            className="grid size-9 place-items-center rounded-sm border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
          </a>

          {request.status === "New" && (
            <Button size="sm" variant="ghost" onClick={() => setStatus("Contacted")} disabled={pending}>
              Contacted
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={() => setExpanded((e) => !e)} icon={<Check />}>
            {expanded ? "Close" : "Confirm"}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStatus("Declined")}
            disabled={pending}
            aria-label="Decline request"
            className="px-2 text-ink-subtle"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {message && (
        <p role="status" className="mt-3 text-xs text-ink-muted">
          {message}
        </p>
      )}

      {expanded && (
        <div className="mt-5 rounded-sm border border-line-subtle bg-canvas-sunken p-4">
          <p className="text-xs text-ink-muted">
            Confirming creates the patient record if they are new, books the slot, and links it back
            to this request.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Select
              label="Clinician"
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              options={doctors.map((d) => ({ value: d.id, label: d.fullName }))}
            />
            <Select
              label="Treatment"
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              options={services.map((s) => ({ value: s.id, label: s.name }))}
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              min={dateKey()}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <Input
              label="Start time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <Input
              label="Duration (min)"
              type="number"
              min={5}
              step={5}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirm} loading={pending}>
              Confirm appointment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
