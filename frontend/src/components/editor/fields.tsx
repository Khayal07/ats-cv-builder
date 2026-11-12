"use client";

import { useId, type ReactNode } from "react";

const labelClass = "font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft";
const controlClass =
  "w-full rounded-md border border-rule bg-panel px-3 py-2 text-[15px] text-ink placeholder:text-ink-faint " +
  "outline-none transition-[border-color,box-shadow] focus:border-ink focus:shadow-[0_0_0_3px_var(--color-marker)]";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, children, className }: FieldShellProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "url" | "month";
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  hint,
  className,
  disabled,
}: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} disabled:bg-desk disabled:text-ink-faint`}
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
  className?: string;
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  hint,
  className,
}: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass} resize-y leading-relaxed`}
      />
    </FieldShell>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-rule pt-6 first:border-t-0 first:pt-0">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-ink-soft">{description}</p> : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function GhostButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className="rounded-md border border-transparent px-2 py-1 text-sm text-ink-soft transition-colors hover:border-rule hover:bg-desk hover:text-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-marker)] disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start rounded-md border border-dashed border-ink-faint px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-marker-soft focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-marker)]"
    >
      {children}
    </button>
  );
}
