import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { EditorialImage } from "@/components/public/editorial-image";
import type { Service } from "@/types";

/**
 * Service card.
 *
 * The whole card is one link — a single tab stop, with the arrow and image
 * responding to `group-hover`. Price is shown as "from" so a listed figure is
 * never mistaken for a fixed quote.
 */
export function ServiceCard({
  service,
  currencySymbol,
  index = 0,
  className,
}: {
  service: Service;
  currencySymbol: string;
  index?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden border border-line-subtle bg-canvas-raised",
        "transition-all duration-500 ease-editorial hover:border-line hover:shadow-lifted",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <EditorialImage
          src={service.coverImageUrl}
          alt={service.name}
          className="size-full"
          imgClassName="transition-transform duration-700 ease-editorial group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          tone={index}
        />
        {service.isFeatured && (
          <span className="absolute left-4 top-4 bg-canvas-raised/95 px-2.5 py-1 text-[0.5625rem] font-medium uppercase tracking-[0.16em] text-ink">
            Signature
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow">{service.categoryName}</p>

        <h3 className="mt-3 font-display text-xl leading-snug text-ink">{service.name}</h3>

        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
          {service.shortDescription}
        </p>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-line-subtle pt-5">
          <div>
            <p className="text-[0.625rem] uppercase tracking-[0.16em] text-ink-subtle">
              {service.priceOnConsultation ? "Pricing" : "From"}
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {service.priceOnConsultation
                ? "On consultation"
                : formatCurrency(service.discountedPrice ?? service.price, currencySymbol)}
            </p>
          </div>

          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink transition-all duration-300 group-hover:border-ink group-hover:bg-primary group-hover:text-on-primary"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
