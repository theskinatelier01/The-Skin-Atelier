import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "accent" | "outline" | "ghost" | "subtle" | "danger";
type Size = "sm" | "md" | "lg";

/**
 * Sizes keep a 44px minimum interactive height at `md` and above; `sm` is
 * reserved for dense admin table rows, where the row itself is also clickable.
 */
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-[0.8125rem] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-[3.25rem] px-8 text-sm gap-2.5",
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover shadow-subtle hover:shadow-card",
  accent: "bg-accent text-on-accent hover:bg-accent-hover shadow-subtle",
  outline:
    "border border-line bg-transparent text-ink hover:border-ink hover:bg-canvas-sunken",
  ghost: "bg-transparent text-ink hover:bg-canvas-sunken",
  subtle: "bg-canvas-sunken text-ink hover:bg-ivory-300 border border-transparent",
  danger: "bg-danger text-white hover:brightness-110",
};

const BASE =
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm font-medium " +
  "tracking-[0.02em] transition-all duration-200 ease-editorial " +
  "disabled:opacity-45 disabled:pointer-events-none select-none";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Decorative only, so it is hidden from assistive technology. */
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading,
    icon,
    iconRight,
    fullWidth,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(BASE, SIZES[size], VARIANTS[variant], fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        icon && (
          <span aria-hidden="true" className="[&>svg]:size-4">
            {icon}
          </span>
        )
      )}
      {children}
      {iconRight && !loading && (
        <span aria-hidden="true" className="[&>svg]:size-4">
          {iconRight}
        </span>
      )}
    </button>
  );
});

export interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
  target?: string;
  rel?: string;
  "aria-label"?: string;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  className,
  children,
  fullWidth,
  target,
  rel,
  ...rest
}: ButtonLinkProps) {
  const external =
    href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");
  const classes = cn(BASE, SIZES[size], VARIANTS[variant], fullWidth && "w-full", className);

  const inner = (
    <>
      {icon && (
        <span aria-hidden="true" className="[&>svg]:size-4">
          {icon}
        </span>
      )}
      {children}
      {iconRight && (
        <span aria-hidden="true" className="[&>svg]:size-4">
          {iconRight}
        </span>
      )}
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target={target}
        rel={target === "_blank" ? (rel ?? "noopener noreferrer") : rel}
        {...rest}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} target={target} rel={rel} {...rest}>
      {inner}
    </Link>
  );
}
