import type { ReactNode } from "react";

/**
 * One status system for lessons across the site: history chips, material cards,
 * lessons inside textbooks and the lesson header all use these icons, labels and chip.
 *
 * Lesson:   ▶ «В процессе» (blue play, as on «Продолжить урок») · ● «Завершён» (the brand's lime dot —
 *           «поставить точку» is the moment a lesson ends).
 * Homework: one ring that fills up — dashed «назначена», half «выполнена» (waits for the teacher),
 *           solid with a check «проверена».
 */

export type LessonStatus = "in_progress" | "completed";
export type HomeworkStatusKey = "assigned" | "completed" | "reviewed";

export const lessonStatus = {
  in_progress: { label: "В процессе" },
  completed: { label: "Завершён" },
} as const satisfies Record<LessonStatus, { label: string }>;

/** Short labels for filters; chips on cards use `homeworkChipLabel`. */
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

export function LessonStatusIcon({ status, className = "size-[18px]" }: { status: LessonStatus; className?: string }) {
  if (status === "completed") {
    return (
      <svg viewBox="0 0 20 20" className={`${className} shrink-0`} aria-hidden>
        <circle cx="10" cy="10" r="5.5" className="fill-lime stroke-green-darker" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className={`${className} shrink-0 text-action`} aria-hidden>
      <circle cx="10" cy="10" r="8.5" fill="currentColor" />
      <path d="M8.3 6.6v6.8l5.3-3.4z" fill="white" />
    </svg>
  );
}

export function HomeworkRing({ status, className = "size-[18px]" }: { status: HomeworkStatusKey; className?: string }) {
  if (status === "reviewed") {
    return (
      <svg viewBox="0 0 20 20" className={`${className} shrink-0 text-green-darker`} aria-hidden>
        <circle cx="10" cy="10" r="8.5" fill="currentColor" />
        <path d="M6.3 10.2l2.4 2.4 4.9-4.9" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "completed") {
    return (
      <svg viewBox="0 0 20 20" className={`${className} shrink-0 text-yellow-darker`} aria-hidden>
        <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 4.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className={`${className} shrink-0 text-info`} aria-hidden>
      <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3.2 2.69" />
    </svg>
  );
}

/** The one status chip: white pill, hairline outline, icon + label. */
export function StatusChip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex h-7 w-max items-center gap-1.5 rounded-full border border-line bg-surface pr-2.5 pl-1.5 text-caption font-semibold text-ink">
      {icon}
      {children}
    </span>
  );
}

export function LessonStatusChip({ status }: { status: LessonStatus | null }) {
  if (!status) return null;
  return <StatusChip icon={<LessonStatusIcon status={status} />}>{lessonStatus[status].label}</StatusChip>;
}

export function HomeworkChip({ status }: { status: HomeworkStatusKey | null }) {
  if (!status) return null;
  return <StatusChip icon={<HomeworkRing status={status} />}>{homeworkChipLabel[status]}</StatusChip>;
}

/** Lesson + homework chips for one learner's lesson, as shown on cards. */
export function LessonStatusChips({ lesson, homework }: { lesson: LessonStatus | null; homework: HomeworkStatusKey | null }) {
  if (!lesson && !homework) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      <LessonStatusChip status={lesson} />
      <HomeworkChip status={homework} />
    </span>
  );
}
