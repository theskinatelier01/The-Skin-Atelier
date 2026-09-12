"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/**
 * Form controls.
 *
 * Every control has a visible label (never placeholder-as-label), and errors
 * render next to the field they belong to, wired with `aria-describedby` and
 * `aria-invalid` so screen readers announce them on focus.
 */

const CONTROL =
  "w-full rounded-sm border bg-canvas-raised px-3.5 text-sm text-ink " +
  "placeholder:text-ink-subtle/70 transition-colors duration-150 " +
  "focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 " +
  "disabled:bg-canvas-sunken disabled:text-ink-subtle disabled:cursor-not-allowed";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-ink">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-label="required">
            *
          </span>
        )}
      </label>
      {children}
      {/* Hint sits above the error so the error is the last thing announced. */}
      {hint && !error && <p className="text-xs text-ink-subtle">{hint}</p>}
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Named `leading` rather than `prefix`, which is a typed HTML attribute. */
  leading?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, required, leading, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  const control = (
    <div className="relative">
      {leading && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-subtle"
        >
          {leading}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          CONTROL,
          "h-11",
          leading && "pl-10",
          error ? "border-danger" : "border-line",
          className,
        )}
        {...props}
      />
    </div>
  );

  if (!label) return control;

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
      {control}
    </Field>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, required, rows = 4, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const control = (
    <textarea
      ref={ref}
      id={inputId}
      rows={rows}
      required={required}
      aria-invalid={error ? true : undefined}
      className={cn(CONTROL, "resize-y py-2.5 leading-relaxed", error ? "border-danger" : "border-line", className)}
      {...props}
    />
  );

  if (!label) return control;

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
      {control}
    </Field>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id, required, options, placeholder, children, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const control = (
    <div className="relative">
      <select
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(
          CONTROL,
          "h-11 appearance-none pr-10",
          error ? "border-danger" : "border-line",
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
      />
    </div>
  );

  if (!label) return control;

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
      {control}
    </Field>
  );
});

export function Checkbox({
  label,
  description,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: string }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    // The whole row is the label, giving a comfortably large hit target.
    <label
      htmlFor={inputId}
      className={cn("flex cursor-pointer items-start gap-3 py-1.5", className)}
    >
      <input
        id={inputId}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-subtle">{description}</span>}
      </span>
    </label>
  );
}

/** Summary of every error, rendered at the top of long forms. */
export function FormErrorSummary({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div
      role="alert"
      className="rounded-sm border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger"
    >
      <p className="font-medium">Please correct the following:</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
