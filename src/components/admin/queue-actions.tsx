"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { updateQueueStatus } from "@/server/actions/clinic";
import type { QueueEntry, QueueStatus } from "@/types";

/**
 * Advances a patient through the waiting queue.
 *
 * Renders only the single next step, so the board stays readable when a dozen
 * people are checked in at once.
 */
const NEXT: Partial<Record<QueueStatus, { status: QueueStatus; label: string }>> = {
  WAITING: { status: "CALLED", label: "Call" },
  CALLED: { status: "WITH DOCTOR", label: "With doctor" },
  "WITH DOCTOR": { status: "TREATMENT", label: "To treatment" },
  TREATMENT: { status: "COMPLETED", label: "Complete" },
};

export function QueueActions({ entry }: { entry: QueueEntry }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const next = NEXT[entry.status];
  if (!next) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await updateQueueStatus(entry.id, next.status);
          router.refresh();
        })
      }
      className="rounded-xs border border-line px-2 py-1 text-[0.6875rem] text-ink transition-colors hover:border-ink hover:bg-canvas-sunken disabled:opacity-50"
    >
      {pending ? "…" : next.label}
    </button>
  );
}
