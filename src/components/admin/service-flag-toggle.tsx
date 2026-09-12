"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import { cn } from "@/lib/utils/cn";
import { toggleServiceFlag } from "@/server/actions/cms";

/**
 * Inline publish toggle.
 *
 * Uses `useOptimistic` so the switch responds instantly, then reconciles with
 * the server result. A rejected write (missing permission, for example) rolls
 * the switch back when the transition settles.
 */
export function ServiceFlagToggle({
  serviceId,
  field,
  value,
  label,
  disabled,
}: {
  serviceId: string;
  field: "isActive" | "isFeatured" | "showOnHomepage";
  value: boolean;
  label: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(value);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={label}
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleServiceFlag(serviceId, field, !value);
          router.refresh();
        })
      }
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
        optimistic ? "bg-charcoal-900" : "bg-line",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        pending && "opacity-70",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-3.5 rounded-full bg-white shadow-subtle transition-transform duration-200 ease-editorial",
          optimistic ? "translate-x-4.5" : "translate-x-1",
        )}
      />
    </button>
  );
}
