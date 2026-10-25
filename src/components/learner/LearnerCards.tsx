"use client";

import Link from "next/link";
import { Check, ChevronDown, Play, RotateCcw } from "lucide-react";
import { HomeworkChip, homeworkChipLabel } from "@/components/ui/Badge";
import { buttonClass, textButtonClass } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import { toast } from "@/components/ui/Toast";
import { contextHref } from "@/lib/context";
import { lessonOfLearnerLesson } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { HomeworkAssignment, HomeworkStatus, LessonSession } from "@/lib/types";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

/** Spec §8.1–8.2: resume the unfinished lesson, or invite to pick material when there is none. */
export function CurrentLesson({ session }: { session: LessonSession | null }) {
  const data = useStore((s) => s.data);
  const context = session && lessonOfLearnerLesson(data, session.learnerLessonId);
  if (!session || !context) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-dashed border-line-strong px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-light text-action">
          <Play size={18} strokeWidth={2} aria-hidden className="translate-x-px" />
        </span>
        <p className="flex-1 font-semibold">Выберите материал, чтобы начать урок</p>
        <a href="#library-heading" className={textButtonClass}>
          Выбрать материал
        </a>
      </div>
    );
  }

  const { lesson, textbook } = context;
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line px-5 py-4">
      <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-action text-white">
        <Play size={20} strokeWidth={2} aria-hidden className="translate-x-px" />
        {/* The lime dot marks the moment a lesson is in motion (brand · Лого). */}
        <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full border-2 border-surface bg-lime" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-bold tracking-wider text-ink-secondary uppercase">Урок в процессе</p>
        <p className="mt-0.5 truncate text-h3">{lesson.title}</p>
        <p className="text-ink-secondary">
          {textbook ? `${textbook.title} · ` : ""}последнее занятие {formatDate(session.lastActivityAt)}
        </p>
      </div>
      {/* Live lesson is another product area; for now this opens a placeholder. */}
      <Link href={contextHref("/live", session.learnerId, { lesson: lesson.id })} className={buttonClass("primary", "lg")}>
        <Play size={18} strokeWidth={2} aria-hidden />
        Продолжить урок
      </Link>
    </div>
  );
}

const statusActions: Record<HomeworkStatus, { to: HomeworkStatus; label: string; icon: React.ReactNode }[]> = {
  assigned: [
    { to: "completed", label: "Отметить как выполненное", icon: <Check {...iconProps} /> },
    { to: "reviewed", label: "Отметить как проверенное", icon: <Check {...iconProps} /> },
  ],
  completed: [
    { to: "reviewed", label: "Отметить как проверенное", icon: <Check {...iconProps} /> },
    { to: "assigned", label: "Вернуть в «Назначено»", icon: <RotateCcw {...iconProps} /> },
  ],
  reviewed: [{ to: "completed", label: "Вернуть в «Выполнено»", icon: <RotateCcw {...iconProps} /> }],
};

const statusToast: Record<HomeworkStatus, string> = {
  assigned: "Задание снова назначено",
  completed: "Отмечено как выполненное",
  reviewed: "Отмечено как проверенное",
};

/** Homework status in the lesson header; the badge opens the status actions. */
export function HomeworkStatusMenu({ homework }: { homework: HomeworkAssignment }) {
  const setHomeworkStatus = useStore((s) => s.setHomeworkStatus);
  return (
    <Menu
      align="left"
      items={statusActions[homework.status].map((action) => ({
        label: action.label,
        icon: action.icon,
        onSelect: () => {
          setHomeworkStatus(homework.id, action.to);
          toast(statusToast[action.to]);
        },
      }))}
      trigger={(props) => (
        <button
          {...props}
          type="button"
          title={homework.title}
          aria-label={`${homeworkChipLabel[homework.status]}: ${homework.title}`}
          className="flex items-center gap-1.5 rounded-xs transition-opacity duration-[120ms] hover:opacity-80"
        >
          <HomeworkChip status={homework.status} />
          <ChevronDown size={16} strokeWidth={1.75} className="text-ink-secondary" aria-hidden />
        </button>
      )}
    />
  );
}
