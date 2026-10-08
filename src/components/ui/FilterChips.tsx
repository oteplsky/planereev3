"use client";

interface FilterChipsProps<T extends string> {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}

/** UI kit · Выбор → Фильтры: pressed-state pills with optional counts. */
export function FilterChips<T extends string>({ label, options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 font-semibold transition-colors duration-[120ms] ${
              selected ? "bg-action text-white" : "bg-light text-ink hover:bg-brand-50"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-caption ${selected ? "bg-white/20" : "bg-surface text-ink-secondary"}`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
