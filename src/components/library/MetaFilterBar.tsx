"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button, TextButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { filterLevelOptions, type Materials } from "@/lib/domain";
import {
  AGE_GROUPS,
  ageGroupLabels,
  levelLabels,
  noFilters,
  SUBJECTS,
  subjectLabels,
  type Level,
  type MetaFilters,
} from "@/lib/meta";

/** Subject / age group / level filter state over a set of materials (the library or the catalog). */
export function useMetaFilters(materials: Materials, initial: MetaFilters = noFilters) {
  const [meta, setMeta] = useState<MetaFilters>(initial);
  const levelOptions = filterLevelOptions(materials, meta);
  const setMetaFilter = (patch: Partial<MetaFilters>) =>
    setMeta((prev) => {
      const next = { ...prev, ...patch };
      // A level the new subject / age group can't have would silently hide everything.
      if (next.level && !filterLevelOptions(materials, next).includes(next.level)) next.level = null;
      return next;
    });
  return { meta, setMetaFilter, resetMeta: () => setMeta(noFilters), levelOptions };
}

/**
 * Filters stay folded behind this button so they don't compete with the materials.
 * The count says how many are set while the panel is closed.
 */
export function FiltersButton({ open, count, onClick }: { open: boolean; count: number; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      aria-expanded={open}
      aria-label={count > 0 ? `Фильтры, выбрано ${count}` : undefined}
      icon={<SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden />}
      onClick={onClick}
      className={open ? "bg-light text-ink" : "text-ink-secondary hover:text-ink"}
    >
      Фильтры
      {count > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-action px-1.5 text-caption font-bold text-white">
          {count}
        </span>
      )}
    </Button>
  );
}

/** How many of the metadata filters are set. */
export const metaFilterCount = (meta: MetaFilters) => [meta.subject, meta.ageGroup, meta.level].filter(Boolean).length;

interface MetaFilterBarProps {
  meta: MetaFilters;
  levelOptions: Level[];
  onChange: (patch: Partial<MetaFilters>) => void;
  /** Shown with «Сбросить фильтры» when any filter is set. */
  active: boolean;
  onReset: () => void;
  /** Filters before the metadata ones (the library's material type). */
  leading?: ReactNode;
  /** Extra filters after the metadata ones (the library's «Источник»). */
  children?: ReactNode;
}

export function MetaFilterBar({ meta, levelOptions, onChange, active, onReset, leading, children }: MetaFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {leading}
      <Select
        aria-label="Предмет"
        placeholder="Предмет"
        value={meta.subject}
        options={SUBJECTS.map((v) => ({ value: v, label: subjectLabels[v] }))}
        onChange={(subject) => onChange({ subject })}
        highlighted={meta.subject !== null}
        className="w-full sm:w-56"
      />
      <Select
        aria-label="Возрастная группа"
        placeholder="Возрастная группа"
        value={meta.ageGroup}
        options={AGE_GROUPS.map((v) => ({ value: v, label: ageGroupLabels[v] }))}
        onChange={(ageGroup) => onChange({ ageGroup })}
        highlighted={meta.ageGroup !== null}
        className="w-full sm:w-52"
      />
      <Select
        aria-label="Уровень"
        placeholder="Уровень"
        value={meta.level}
        options={levelOptions.map((v) => ({ value: v, label: levelLabels[v] }))}
        onChange={(level) => onChange({ level })}
        highlighted={meta.level !== null}
        className="w-full sm:w-48"
      />
      {children}
      {active && <TextButton onClick={onReset}>Сбросить фильтры</TextButton>}
    </div>
  );
}
