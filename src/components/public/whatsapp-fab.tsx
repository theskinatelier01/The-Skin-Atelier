"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { whatsappLink } from "@/lib/utils/format";

/**
 * Floating WhatsApp action.
 *
 * Appears only after the visitor has scrolled past the hero, so it never
 * competes with the primary hero call to action. Positioned inside the safe
 * area so it clears the iOS home indicator.
 */
export function WhatsAppFab({ phone, clinicName }: { phone: string; clinicName: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappLink(phone, `Hello ${clinicName}, I would like to enquire about a treatment.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      tabIndex={visible ? 0 : -1}
      className={cn(
        "no-print fixed right-5 z-30 flex size-14 items-center justify-center rounded-full",
        "bg-charcoal-900 text-ivory-100 shadow-lifted transition-all duration-400 ease-editorial",
        "hover:bg-charcoal-800 focus-visible:outline-2 focus-visible:outline-offset-2",
        "bottom-[calc(1.25rem+env(safe-area-inset-bottom))]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <MessageCircle className="size-6" aria-hidden="true" />
    </a>
  );
}
