import type { ReactNode } from "react";

// UI kit · Метки: softest background, 3px accent bar on the left, dark text.
const tones = {
  neutral: "bg-neutral-100 shadow-[inset_3px_0_0_var(--color-neutral-400)]",
  info: "bg-blue-softest shadow-[inset_3px_0_0_var(--color-info)]",
  success: "bg-green-softest shadow-[inset_3px_0_0_var(--color-success)]",
  warning: "bg-yellow-softest shadow-[inset_3px_0_0_var(--color-warning)]",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex w-max items-center rounded-xs py-1 pr-2 pl-2.5 text-caption font-semibold text-ink ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Learner's progress with a lesson (spec §9 statuses). */
export function LessonStatusBadge({ status }: { status: "in_progress" | "completed" | null }) {
  if (status === "in_progress") return <Badge tone="info">В процессе</Badge>;
  if (status === "completed") return <Badge tone="success">Завершён</Badge>;
  return null;
}

/** Spec §10.2. «Выполнено» waits for the teacher, so it gets the attention tone. */
export const homeworkStatus = {
  assigned: { label: "Назначено", tone: "info" },
  completed: { label: "Выполнено", tone: "warning" },
  reviewed: { label: "Проверено", tone: "success" },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>;

export function HomeworkStatusBadge({ status }: { status: keyof typeof homeworkStatus }) {
  const { label, tone } = homeworkStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}
