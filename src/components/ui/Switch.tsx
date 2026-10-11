"use client";

import { useId } from "react";

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** When set, the switch is locked and this explains why (tooltip on hover and focus). */
  lockedReason?: string;
}

/**
 * UI kit · Переключатель. A locked switch stays focusable (aria-disabled, not disabled)
 * so keyboard and pointer users can both reach the reason.
 */
export function Switch({ label, checked, onChange, lockedReason }: SwitchProps) {
  const tipId = useId();
  const locked = !!lockedReason;
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={locked || undefined}
        aria-describedby={locked ? tipId : undefined}
        onClick={() => !locked && onChange(!checked)}
        className={`inline-flex items-center gap-3 rounded-sm font-semibold ${locked ? "cursor-not-allowed text-ink-secondary" : "text-ink"}`}
      >
        <span
          aria-hidden
          className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${
            checked ? "bg-action" : "bg-neutral-300"
          } ${locked ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-1 transition-transform duration-200 ${
              checked ? "translate-x-4" : ""
            }`}
          />
        </span>
        {label}
      </button>
      {locked && (
        <span
          id={tipId}
          role="tooltip"
          className="pointer-events-none absolute top-full left-0 z-30 mt-2 w-max max-w-72 rounded-sm bg-neutral-900 px-3 py-2 text-caption text-white opacity-0 shadow-2 transition-opacity duration-[120ms] group-focus-within:opacity-100 group-hover:opacity-100"
        >
          {lockedReason}
        </span>
      )}
    </span>
  );
}
