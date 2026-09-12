"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, LogIn, MessageCircle, MoreHorizontal, Stethoscope, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/overlay";
import { updateAppointmentStatus } from "@/server/actions/clinic";
import { whatsappLink } from "@/lib/utils/format";
import type { Appointment, AppointmentStatus } from "@/types";

/**
 * Inline appointment actions for the front desk table.
 *
 * The primary action is whatever comes next in the appointment's lifecycle, so
 * checking a patient in is one click rather than a menu dive. Everything else
 * sits behind the overflow control.
 */
export function AppointmentRowActions({
  appointment,
  whatsappTemplate,
}: {
  appointment: Appointment;
  whatsappTemplate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(status: AppointmentStatus, reason?: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointment.id, status, reason);
      if (!result.ok) setError(result.message ?? "That did not work.");
      else router.refresh();
      setMenuOpen(false);
      setConfirmCancel(false);
    });
  }

  const next = NEXT_STATUS[appointment.status];
  const terminal = ["Completed", "Cancelled", "No Show"].includes(appointment.status);

  return (
    <div className="flex items-center justify-end gap-1">
      {error && (
        <span role="alert" className="mr-2 text-xs text-danger">
          {error}
        </span>
      )}

      {next && (
        <Button
          size="sm"
          variant={appointment.status === "Booked" ? "outline" : "primary"}
          loading={pending}
          onClick={() => run(next.status)}
          icon={next.icon}
        >
          {next.label}
        </Button>
      )}

      <a
        href={whatsappLink(appointment.patientPhone, whatsappTemplate)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${appointment.patientName}`}
        className="grid size-9 place-items-center rounded-sm text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
      </a>

      {!terminal && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="More actions"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="grid size-9 place-items-center rounded-sm text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink"
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </button>

          {menuOpen && (
            <>
              {/* Click-away layer, hidden from assistive tech. */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 w-48 rounded-sm border border-line bg-canvas-raised py-1 shadow-lifted"
              >
                <MenuItem onClick={() => run("Confirmed")}>Mark confirmed</MenuItem>
                <MenuItem onClick={() => run("Completed")}>Mark completed</MenuItem>
                <MenuItem onClick={() => run("No Show")}>Mark no-show</MenuItem>
                <div className="my-1 border-t border-line-subtle" />
                <MenuItem destructive onClick={() => setConfirmCancel(true)}>
                  Cancel appointment
                </MenuItem>
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => run("Cancelled", "Cancelled at the front desk")}
        title="Cancel this appointment?"
        message={`${appointment.patientName} at ${appointment.startTime} for ${appointment.serviceName}. The slot will be released and the patient is not notified automatically.`}
        confirmLabel="Cancel appointment"
        destructive
        loading={pending}
      />
    </div>
  );
}

function MenuItem({
  onClick,
  destructive,
  children,
}: {
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-[0.8125rem] transition-colors hover:bg-canvas-sunken ${
        destructive ? "text-danger" : "text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** The single most likely next step for each status. */
const NEXT_STATUS: Partial<
  Record<AppointmentStatus, { status: AppointmentStatus; label: string; icon: React.ReactNode }>
> = {
  Booked: { status: "Confirmed", label: "Confirm", icon: <Check /> },
  Confirmed: { status: "Arrived", label: "Check in", icon: <LogIn /> },
  Arrived: { status: "In Consultation", label: "To doctor", icon: <Stethoscope /> },
  "In Consultation": { status: "Treatment", label: "To treatment", icon: <Stethoscope /> },
  Treatment: { status: "Completed", label: "Complete", icon: <Check /> },
};
