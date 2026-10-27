import type { ReactNode } from "react";

/**
 * One status system for lessons across the site: the profile history, lessons inside textbooks,
 * material cards and the lesson header all show statuses the same way — quiet text, no colour:
 * «Завершён · Домашка проверена». Only homework waiting for the teacher is set in ink to stand out.
 */

export type LessonStatus = "in_progress" | "completed";
export type HomeworkStatusKey = "assigned" | "completed" | "reviewed";

export const lessonStatus = {
  in_progress: { label: "В процессе" },
  completed: { label: "Завершён" },
} as const satisfies Record<LessonStatus, { label: string }>;

/** Short labels for filters; status lines use `homeworkChipLabel`. */
export const homeworkStatus = {
  assigned: { label: "Назначено" },
  completed: { label: "Выполнено" },
  reviewed: { label: "Проверено" },
} as const satisfies Record<HomeworkStatusKey, { label: string }>;

export const homeworkChipLabel: Record<HomeworkStatusKey, string> = {
  assigned: "Домашка назначена",
  completed: "Домашка выполнена",
  reviewed: "Домашка проверена",
};

/** Homework in this status waits for the teacher. */
export const NEEDS_ATTENTION: HomeworkStatusKey = "completed";

/** Ink for homework waiting for the teacher; otherwise inherits the quiet secondary text. */
export const homeworkTextClass = (status: HomeworkStatusKey) => (status === NEEDS_ATTENTION ? "font-semibold text-ink" : "");

/** «Завершён · Домашка проверена», as in the profile history. */
export function LessonStatusText({
  lesson,
  homework,
  className = "text-caption",
}: {
  lesson: LessonStatus | null;
  homework: HomeworkStatusKey | null;
  className?: string;
}) {
  if (!lesson && !homework) return null;
  return (
    <span className={`text-ink-secondary ${className}`}>
      {lesson && lessonStatus[lesson].label}
      {lesson && homework && " · "}
      {homework && <span className={homeworkTextClass(homework)}>{homeworkChipLabel[homework]}</span>}
    </span>
  );
}

/** The one status chip: white pill, hairline outline, icon + label. Now only «В библиотеке». */
export function StatusChip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex h-7 w-max items-center gap-1.5 rounded-full border border-line bg-surface pr-2.5 pl-1.5 text-caption font-semibold text-ink">
      {icon}
      {children}
    </span>
  );
}
