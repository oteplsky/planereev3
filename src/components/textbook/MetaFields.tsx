"use client";

import { SelectField, TextField } from "@/components/ui/Field";
import {
  AGE_GROUPS,
  ageGroupLabels,
  customSubjectLabel,
  levelLabels,
  levelsFor,
  normalizeMeta,
  SUBJECTS,
  subjectLabels,
  type MaterialMeta,
} from "@/lib/meta";

interface MetaFieldsProps {
  meta: MaterialMeta;
  onChange: (meta: MaterialMeta) => void;
  /** Mark empty required fields. Off when creating, where «Создать» stays disabled instead. */
  showErrors?: boolean;
  className?: string;
}

/**
 * «Предмет» → «Возрастная группа» → «Уровень», in that order: the level list depends on the
 * first two, and a change that makes the chosen level invalid clears it (normalizeMeta).
 */
export function MetaFields({ meta, onChange, showErrors = false, className = "flex flex-col gap-4" }: MetaFieldsProps) {
  const set = (patch: Partial<MaterialMeta>) => onChange(normalizeMeta({ ...meta, ...patch }));
  const levels = levelsFor(meta.subject, meta.ageGroup);
  const missing = (empty: boolean) => showErrors && empty && "Обязательное поле";

  return (
    <div className={className}>
      <SelectField
        label="Предмет"
        hint="Иностранный язык (кроме английского) для школы — выберите „Другой предмет“: там уровни по классам"
        required
        value={meta.subject}
        options={SUBJECTS.map((s) => ({ value: s, label: subjectLabels[s] }))}
        onChange={(subject) => set({ subject })}
        error={missing(!meta.subject)}
      />
      {meta.subject && customSubjectLabel[meta.subject] && (
        <TextField
          label={customSubjectLabel[meta.subject]!}
          required
          value={meta.customSubject}
          onChange={(e) => set({ customSubject: e.target.value })}
          maxLength={80}
          placeholder={meta.subject === "other_language" ? "Например, немецкий" : "Например, физика"}
          error={missing(!meta.customSubject.trim())}
        />
      )}
      <SelectField
        label="Возрастная группа"
        required
        value={meta.ageGroup}
        options={AGE_GROUPS.map((a) => ({ value: a, label: ageGroupLabels[a] }))}
        onChange={(ageGroup) => set({ ageGroup })}
        error={missing(!meta.ageGroup)}
      />
      <SelectField
        label="Уровень"
        required
        value={meta.level}
        options={levels.map((l) => ({ value: l, label: levelLabels[l] }))}
        onChange={(level) => set({ level })}
        disabled={levels.length === 0}
        error={missing(levels.length > 0 && !meta.level) && "Выберите уровень"}
      />
    </div>
  );
}
