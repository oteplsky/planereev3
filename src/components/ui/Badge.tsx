import type { ReactNode } from "react";
import { CircleCheck, CircleDashed, Clipboard, ClipboardCheck, ClipboardPen, type LucideIcon } from "lucide-react";

/**
 * One status system for lessons across the site: the profile history, lessons inside textbooks,
 * material cards and the lesson header share the same labels and colours — quiet, no colour:
 * text where there's room («Завершён · Домашка проверена»), icons on cards and lesson rows.
 * Only homework waiting for the teacher is set in ink to stand out.
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
  completed: { label: "К проверке" },
  reviewed: { label: "Проверено" },
} as const satisfies Record<HomeworkStatusKey, { label: string }>;

export const homeworkChipLabel: Record<HomeworkStatusKey, string> = {
  assigned: "Домашка назначена",
  completed: "Домашка ждёт проверки",
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

const lessonIcon: Record<LessonStatus, LucideIcon> = { in_progress: CircleDashed, completed: CircleCheck };
const homeworkIcon: Record<HomeworkStatusKey, LucideIcon> = { assigned: Clipboard, completed: ClipboardPen, reviewed: ClipboardCheck };

/** A small grey glyph that names itself on hover; sits above a card's stretched link so the tip shows. */
function StatusGlyph({ Icon, label, attention = false }: { Icon: LucideIcon; label: string; attention?: boolean }) {
  return (
    <span className={`group/glyph relative z-10 inline-flex ${attention ? "text-ink" : "text-ink-secondary"}`} role="img" aria-label={label}>
      <Icon size={16} strokeWidth={attention ? 2.25 : 1.75} aria-hidden />
      {attention && <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-ink ring-2 ring-surface" aria-hidden />}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full -left-1 z-30 mb-1.5 w-max rounded-sm bg-neutral-900 px-2 py-1 text-caption text-white opacity-0 shadow-2 transition-opacity duration-[120ms] group-hover/glyph:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

/** Statuses on material cards and lesson rows: icons instead of words; only homework waiting for the teacher is in ink. */
export function LessonStatusIcons({ lesson, homework }: { lesson: LessonStatus | null; homework: HomeworkStatusKey | null }) {
  if (!lesson && !homework) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      {lesson && <StatusGlyph Icon={lessonIcon[lesson]} label={`Урок ${lessonStatus[lesson].label.toLowerCase()}`} />}
      {homework && (
        <StatusGlyph Icon={homeworkIcon[homework]} label={homeworkChipLabel[homework]} attention={homework === NEEDS_ATTENTION} />
      )}
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
