"use client";

import { Search, X } from "lucide-react";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

/** UI kit · Поиск: 40px, clear button appears after typing. */
export function SearchField({ value, onChange, placeholder, className = "" }: SearchFieldProps) {
  return (
    <label
      className={`flex h-10 items-center gap-2 rounded-sm border border-line-strong bg-surface px-3 transition-colors focus-within:border-action ${className}`}
    >
      <Search size={18} strokeWidth={1.75} className="shrink-0 text-ink-secondary" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && value && onChange("")}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Очистить поиск"
          className="grid size-6 place-items-center rounded-full text-ink-secondary hover:bg-light hover:text-ink"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      )}
    </label>
  );
}
