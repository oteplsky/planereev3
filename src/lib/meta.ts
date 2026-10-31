// Textbook metadata: subject, age group and level. Level options depend on the other two.

export type Subject = "english" | "english_school" | "math" | "russian_school" | "other_language" | "other";
export type AgeGroup = "kids" | "teens" | "adults";

const CEFR = ["pre_a1", "a1", "a2", "b1", "b2", "c1", "c2"] as const;
const GRADES = ["grade_1", "grade_2", "grade_3", "grade_4", "grade_5", "grade_6", "grade_7", "grade_8", "grade_9", "grade_10", "grade_11"] as const;

export type Level = (typeof CEFR)[number] | (typeof GRADES)[number] | "preschool_ed" | "other";

export interface MaterialMeta {
  subject: Subject | null;
  /** The language or subject name; required for «Другой иностранный язык» and «Другой предмет», empty otherwise. */
  customSubject: string;
  ageGroup: AgeGroup | null;
  /** Null until chosen, or after a subject/age change made the previous level invalid. */
  level: Level | null;
}

export const emptyMeta: MaterialMeta = { subject: null, customSubject: "", ageGroup: null, level: null };

export const subjectLabels: Record<Subject, string> = {
  english: "Английский язык",
  english_school: "Английский язык (школа)",
  math: "Математика",
  russian_school: "Русский язык (школа)",
  other_language: "Другой иностранный язык",
  other: "Другой предмет",
};

/** Subjects the teacher names themselves, and the label of that field. */
export const customSubjectLabel: Partial<Record<Subject, string>> = {
  other_language: "Укажите язык",
  other: "Укажите предмет",
};

export const needsCustomSubject = (subject: Subject | null) => !!subject && subject in customSubjectLabel;

/** Language courses outside school are measured on the CEFR scale, at any age; everything else by school stage. */
const usesCefr = (subject: Subject) => subject === "english" || subject === "other_language";

/** Preschool materials are «Дети» with the «Дошкольное образование» level. */
export const ageGroupLabels: Record<AgeGroup, string> = {
  kids: "Дети",
  teens: "Подростки",
  adults: "Взрослые",
};

export const levelLabels: Record<Level, string> = {
  pre_a1: "Pre-A1", a1: "A1", a2: "A2", b1: "B1", b2: "B2", c1: "C1", c2: "C2",
  preschool_ed: "Дошкольное образование",
  ...(Object.fromEntries(GRADES.map((g, i) => [g, `${i + 1} класс`])) as Record<(typeof GRADES)[number], string>),
  other: "Другое",
};

export const SUBJECTS = Object.keys(subjectLabels) as Subject[];
export const AGE_GROUPS = Object.keys(ageGroupLabels) as AgeGroup[];

/** Display order of every level; «Другое» last. */
const LEVEL_ORDER: Level[] = [...CEFR, "preschool_ed", ...GRADES, "other"];

export const sortLevels = (levels: Iterable<Level>): Level[] => {
  const set = new Set(levels);
  return LEVEL_ORDER.filter((l) => set.has(l));
};

/**
 * Levels for a subject and age group, in display order. Empty until both are chosen.
 * Grades 5–6 appear for both «Дети» and «Подростки» on purpose. Adults have only «Другое» for now.
 */
export function levelsFor(subject: Subject | null, ageGroup: AgeGroup | null): Level[] {
  if (!subject || !ageGroup) return [];
  if (usesCefr(subject)) return [...CEFR, "other"];
  if (ageGroup === "kids") return ["preschool_ed", ...GRADES.slice(0, 6), "other"];
  if (ageGroup === "teens") return [...GRADES.slice(4), "other"];
  return ["other"];
}

/**
 * Brings metadata saved by earlier prototype versions in line with the current options:
 * «Дошкольники» becomes «Дети», and a level that no longer exists is cleared for the teacher to pick again.
 */
export function migrateMeta(meta: MaterialMeta): MaterialMeta {
  const ageGroup = (meta.ageGroup as string) === "preschool" ? "kids" : meta.ageGroup;
  const level = meta.level && meta.level in levelLabels ? meta.level : null;
  return normalizeMeta({ ...meta, ageGroup, level });
}

/** Clears a level that the subject / age group no longer allows, and a custom subject that no longer applies. */
export function normalizeMeta(meta: MaterialMeta): MaterialMeta {
  const level = meta.level && levelsFor(meta.subject, meta.ageGroup).includes(meta.level) ? meta.level : null;
  return { ...meta, customSubject: needsCustomSubject(meta.subject) ? meta.customSubject : "", level };
}

/** All required fields are filled. */
export function isMetaComplete(meta: MaterialMeta): boolean {
  return (
    meta.subject !== null &&
    (!needsCustomSubject(meta.subject) || meta.customSubject.trim() !== "") &&
    meta.ageGroup !== null &&
    meta.level !== null &&
    levelsFor(meta.subject, meta.ageGroup).includes(meta.level)
  );
}

/** «Английский язык», «Взрослые», «B1»: what's filled in; a named language or subject replaces «Другой …». */
export function metaParts(meta: MaterialMeta): string[] {
  const subject = meta.subject && ((needsCustomSubject(meta.subject) && meta.customSubject.trim()) || subjectLabels[meta.subject]);
  return [subject, meta.ageGroup && ageGroupLabels[meta.ageGroup], meta.level && levelLabels[meta.level]].filter(
    (part): part is string => !!part,
  );
}

/** «Английский язык · Взрослые · B1». */
export function metaSummary(meta: MaterialMeta): string {
  return metaParts(meta).join(" · ");
}

export interface MetaFilters {
  subject: Subject | null;
  ageGroup: AgeGroup | null;
  level: Level | null;
}

export const noFilters: MetaFilters = { subject: null, ageGroup: null, level: null };

export function hasActiveFilters(filters: MetaFilters): boolean {
  return filters.subject !== null || filters.ageGroup !== null || filters.level !== null;
}

/** AND across the selected filters. Materials without metadata match only when no filter is set. */
export function matchesFilters(meta: MaterialMeta | null, filters: MetaFilters): boolean {
  if (!hasActiveFilters(filters)) return true;
  if (!meta) return false;
  return (
    (filters.subject === null || meta.subject === filters.subject) &&
    (filters.ageGroup === null || meta.ageGroup === filters.ageGroup) &&
    (filters.level === null || meta.level === filters.level)
  );
}
