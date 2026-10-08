"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, Check, Ellipsis, ExternalLink, Play, RotateCcw } from "lucide-react";
import { HomeworkStatusBadge, LessonStatusBadge } from "@/components/ui/Badge";
import { buttonClass, IconButton } from "@/components/ui/Button";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { toast } from "@/components/ui/Toast";
import { contextHref } from "@/lib/context";
import { lessonOfLearnerLesson, type HistoryEntry } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { HomeworkAssignment, HomeworkStatus, LessonSession } from "@/lib/types";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

/** Spec §8.1–8.2: resume the unfinished lesson, or a compact hint — never a misleading «Начать урок». */
export function CurrentLesson({ session }: { session: LessonSession | null }) {
  const data = useStore((s) => s.data);
  const context = session && lessonOfLearnerLesson(data, session.learnerLessonId);

  if (!session || !context) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-line-strong px-5 py-4 text-ink-secondary">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-light text-action">
          <Play size={16} strokeWidth={2} aria-hidden />
        </span>
        <p className="flex-1">Выберите урок из библиотеки, чтобы начать занятие</p>
        <a href="#library-heading" className="flex items-center gap-1 rounded-xs font-semibold text-action hover:text-action-hover">
          К библиотеке <ArrowDown size={16} strokeWidth={1.75} aria-hidden />
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
      <Link href={contextHref(`/lesson/${lesson.id}`, session.learnerId)} className={buttonClass("primary", "lg")}>
        <Play size={18} strokeWidth={2} aria-hidden />
        Продолжить урок
      </Link>
    </div>
  );
}

const targetLabel: Record<HomeworkAssignment["targetType"], string> = {
  lesson: "Весь урок",
  section: "Раздел урока",
  exercise: "Упражнение",
};

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

/** Spec §10.3: title, related lesson, assignment date, status, completion date. No deadlines. */
export function HomeworkCard({ homework }: { homework: HomeworkAssignment }) {
  const data = useStore((s) => s.data);
  const setHomeworkStatus = useStore((s) => s.setHomeworkStatus);
  const router = useRouter();
  const context = lessonOfLearnerLesson(data, homework.learnerLessonId);
  const lessonHref = context && contextHref(`/lesson/${context.lesson.id}`, homework.learnerId);

  const items: MenuItem[] = statusActions[homework.status].map((action) => ({
    label: action.label,
    icon: action.icon,
    onSelect: () => {
      setHomeworkStatus(homework.id, action.to);
      toast(statusToast[action.to]);
    },
  }));

  return (
    <article className="group relative flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 transition-colors duration-[120ms] hover:border-line-strong">
      <div className="flex items-start justify-between gap-2">
        <HomeworkStatusBadge status={homework.status} />
        <Menu
          items={
            lessonHref
              ? [...items, { label: "Открыть урок", icon: <ExternalLink {...iconProps} />, onSelect: () => router.push(lessonHref) }]
              : items
          }
          trigger={(props) => (
            <IconButton {...props} label={`Действия: ${homework.title}`} size="sm" className="relative z-10 -mt-1 -mr-1">
              <Ellipsis size={20} strokeWidth={1.75} />
            </IconButton>
          )}
        />
      </div>
      <div className="min-w-0">
        {lessonHref ? (
          <Link href={lessonHref} className="line-clamp-2 text-body-lg font-bold after:absolute after:inset-0 after:rounded-lg">
            {homework.title}
          </Link>
        ) : (
          <p className="line-clamp-2 text-body-lg font-bold">{homework.title}</p>
        )}
        <p className="mt-1 truncate text-ink-secondary">
          {targetLabel[homework.targetType]}
          {context && homework.targetType !== "lesson" ? ` · ${context.lesson.title}` : ""}
          {context?.textbook ? ` · ${context.textbook.title}` : ""}
        </p>
      </div>
      <dl className="mt-auto grid gap-0.5 text-caption text-ink-secondary">
        <div className="flex gap-1">
          <dt>Назначено</dt>
          <dd>{formatDate(homework.assignedAt)}</dd>
        </div>
        {homework.completedAt && (
          <div className="flex gap-1">
            <dt>Выполнено</dt>
            <dd>{formatDate(homework.completedAt)}</dd>
          </div>
        )}
        {homework.reviewedAt && (
          <div className="flex gap-1">
            <dt>Проверено</dt>
            <dd>{formatDate(homework.reviewedAt)}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

/** Spec §9: lesson, textbook, last activity, status. Opens the learner's own lesson. */
export function HistoryCard({ entry, learnerId }: { entry: HistoryEntry; learnerId: string }) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 transition-colors duration-[120ms] hover:border-line-strong">
      <LessonStatusBadge status={entry.status} />
      <div className="min-w-0">
        <Link
          href={contextHref(`/lesson/${entry.lesson.id}`, learnerId)}
          className="line-clamp-2 text-body-lg font-bold after:absolute after:inset-0 after:rounded-lg"
        >
          {entry.lesson.title}
        </Link>
        <p className="mt-1 truncate text-ink-secondary">{entry.textbook?.title ?? "Отдельный урок"}</p>
      </div>
      <p className="mt-auto text-caption text-ink-secondary">{formatDate(entry.lastActivityAt)}</p>
    </article>
  );
}
