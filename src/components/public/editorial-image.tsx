import Image from "next/image";

import { cn } from "@/lib/utils/cn";

/**
 * Editorial image with a designed empty state.
 *
 * Before the clinic uploads its photography through the media library, every
 * image slot would otherwise render as a broken box. Instead we paint a tonal
 * placeholder in the brand palette with the monogram, so an unseeded site still
 * reads as intentional rather than unfinished.
 */
export function EditorialImage({
  src,
  alt,
  className,
  imgClassName,
  priority,
  sizes = "100vw",
  fill = true,
  width,
  height,
  tone = 0,
  kenBurns,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  /** Varies the placeholder so a grid of them does not look flat. */
  tone?: number;
  kenBurns?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn("relative overflow-hidden bg-ivory-200", className)}
        // Decorative placeholder: the real alt text belongs to the photograph
        // that will replace it, so this is hidden from assistive technology.
        role="img"
        aria-label={alt}
      >
        <div className={cn("absolute inset-0", PLACEHOLDER_TONES[tone % PLACEHOLDER_TONES.length])} />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), transparent 55%)",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center font-display text-[clamp(2rem,6vw,4rem)] tracking-[0.3em] text-charcoal-900/12"
        >
          TSA
        </span>
      </div>
    );
  }

  if (!fill) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width ?? 1200}
        height={height ?? 800}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn("object-cover", imgClassName)}
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className={cn("object-cover", kenBurns && "ken-burns", imgClassName)}
      />
    </div>
  );
}

const PLACEHOLDER_TONES = [
  "bg-gradient-to-br from-ivory-300 via-sand-100 to-sand-200",
  "bg-gradient-to-br from-sand-100 via-ivory-200 to-sand-300",
  "bg-gradient-to-tr from-ivory-200 via-sand-200 to-ivory-300",
  "bg-gradient-to-bl from-sand-200 via-sand-100 to-ivory-200",
];
