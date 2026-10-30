"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown, Info } from "lucide-react";

// UI kit · Поля: 40px, 1px #DDD border, blue border and soft ring on focus, red on error.
export const fieldClass =
  "w-full rounded-sm border bg-surface px-3 text-ink outline-none transition-colors placeholder:text-neutral-400 focus:border-action focus:ring-3 focus:ring-action/15 disabled:cursor-not-allowed disabled:bg-hover disabled:text-ink-secondary";
const borderClass = (invalid?: boolean) => (invalid ? "border-danger-hover" : "border-line-strong");

interface FieldShellProps {
  label: string;
  /** Shown on hover or focus of an ⓘ next to the label. */
  hint?: string;
  required?: boolean;
  error?: string | false;
  id: string;
  children: ReactNode;
}

function FieldShell({ label, hint, required, error, id, children }: FieldShellProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label htmlFor={id} className="text-body font-semibold text-ink">
          {label}
          {required && (
            <span className="text-danger-hover" aria-hidden>
              {" "}*
            </span>
          )}
        </label>
        {hint && <Hint text={hint} />}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-caption text-danger-hover">
          {error}
        </p>
      )}
    </div>
  );
}

function Hint({ text }: { text: string }) {
  const tipId = useId();
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Подсказка"
        aria-describedby={tipId}
        className="grid size-5 place-items-center rounded-full text-ink-secondary transition-colors duration-[120ms] hover:text-action focus-visible:text-action"
      >
        <Info size={16} strokeWidth={1.75} aria-hidden />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-sm bg-neutral-900 px-3 py-2 text-caption font-normal text-white opacity-0 shadow-2 transition-opacity duration-[120ms] group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

type Common = { label: string; error?: string | false };

export function TextField({ label, error, required, className = "", ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell label={label} required={required} error={error} id={id}>
      <input
        id={id}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-10 ${fieldClass} ${borderClass(!!error)} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function TextArea({ label, error, required, className = "", ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell label={label} required={required} error={error} id={id}>
      <textarea
        id={id}
        required={required}
        aria-invalid={!!error || undefined}
        className={`min-h-20 resize-y py-2.5 ${fieldClass} ${borderClass(!!error)} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  label: string;
  hint?: string;
  error?: string | false;
  value: T | null;
  options: SelectOption<T>[];
  placeholder?: string;
  onChange: (value: T | null) => void;
}

/** Native select styled as a field: keyboard and screen-reader behaviour come for free. */
export function SelectField<T extends string>({ label, hint, error, required, ...props }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <FieldShell label={label} hint={hint} required={required} error={error} id={id}>
      <Select id={id} required={required} invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...props} />
    </FieldShell>
  );
}

/** The bare select, also used without a label (filters). */
export function Select<T extends string>({
  value,
  options,
  placeholder = "Выберите",
  onChange,
  invalid,
  highlighted,
  allowEmpty = true,
  className = "",
  ...props
}: Omit<SelectFieldProps<T>, "label" | "hint" | "error"> & {
  invalid?: boolean;
  /** Active filter look. */
  highlighted?: boolean;
  /** False when there is always a value: no empty placeholder option. */
  allowEmpty?: boolean;
}) {
  return (
    <span className={`relative block ${className}`}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange((e.target.value || null) as T | null)}
        aria-invalid={invalid || undefined}
        className={`h-10 appearance-none pr-9 ${fieldClass} ${
          highlighted ? "border-action bg-selected font-semibold text-action" : `${borderClass(invalid)} ${value ? "" : "text-ink-secondary"}`
        }`}
        {...props}
      >
        {allowEmpty && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-ink">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        strokeWidth={1.75}
        className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 ${highlighted ? "text-action" : "text-ink-secondary"}`}
        aria-hidden
      />
    </span>
  );
}
