"use client";

import { useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { homeworkChipLabel, homeworkStatus, lessonStatus } from "@/components/ui/Badge";
import { FilterChips } from "@/components/ui/FilterChips";
import { contextHref } from "@/lib/context";
import { getCurrentSession, getLessonHistory, lessonOfLearnerLesson, type HistoryEntry } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { HomeworkStatus, Learner } from "@/lib/types";

/** Homework in this status waits for the teacher: set in ink in the history. */
const NEEDS_ATTENTION: HomeworkStatus = "completed";

/**
 * Learner actions next to the name (spec §7.1): lesson history one quiet click away, then one way back
 * to the lesson — the one in progress, or else the latest one. No learning path: nothing is suggested.
 */
export function LearnerActions({ learner }: { learner: Learner }) {
  const data = useStore((s) => s.data);
  const [showAll, setShowAll] = useState(false);
  const current = getCurrentSession(data, learner.id);
  const inProgress = current && lessonOfLearnerLesson(data, current.learnerLessonId);
  const history = getLessonHistory(data, learner.id);
  const latest = history[0]?.lesson;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {history.length > 0 && (
        <>
          <Button
            variant="ghost"
            icon={<History size={18} strokeWidth={1.75} aria-hidden />}
            onClick={() => setShowAll(true)}
            className="text-ink-secondary hover:text-ink"
          >
            История уроков
          </Button>
          <Dialog open={showAll} onClose={() => setShowAll(false)} title="История уроков" wide>
            <FullHistory history={history} learnerId={learner.id} />
          </Dialog>
        </>
      )}
      {inProgress ? (
        // Live lesson is another product area; for now this opens a placeholder.
        <Link
          href={contextHref("/live", learner.id, { lesson: inProgress.lesson.id })}
          title={inProgress.lesson.title}
          className={buttonClass("primary")}
        >
          Продолжить урок
        </Link>
      ) : (
        latest && (
          <Link href={contextHref(`/lesson/${latest.id}`, learner.id)} title={latest.title} className={buttonClass("primary")}>
            Последний урок
          </Link>
        )
      )}
    </div>
  );
}

type HistoryFilter = "all" | HomeworkStatus;

/** Every lesson, filterable by homework status — e.g. to find work waiting for a check. */
function FullHistory({ history, learnerId }: { history: HistoryEntry[]; learnerId: string }) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const shown = filter === "all" ? history : history.filter((h) => h.homework === filter);
  const countOf = (status: HomeworkStatus) => history.filter((h) => h.homework === status).length;
  const statuses = (["completed", "assigned", "reviewed"] as const).filter((s) => countOf(s) > 0);

  return (
    <div className="flex flex-col gap-4">
      {statuses.length > 0 && (
        <FilterChips
          label="Домашка"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Все", count: history.length },
            ...statuses.map((status) => ({ value: status, label: homeworkStatus[status].label, count: countOf(status) })),
          ]}
        />
      )}
      <ul className="-mx-2 max-h-[60vh] divide-y divide-line overflow-y-auto">
        {shown.map((entry) => (
          <li key={entry.learnerLesson.id}>
            <HistoryRow entry={entry} learnerId={learnerId} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A line in the full history: title, where it's from and when, then statuses as plain text.
 * No colour — only homework waiting for the teacher is set in ink to stand out.
 */
function HistoryRow({ entry, learnerId }: { entry: HistoryEntry; learnerId: string }) {
  return (
    <Link
      href={contextHref(`/lesson/${entry.lesson.id}`, learnerId)}
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md px-2 py-3 transition-colors duration-[120ms] hover:bg-hover"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{entry.lesson.title}</p>
        <p className="truncate text-caption text-ink-secondary">
          {[entry.textbook?.title, formatDate(entry.lastActivityAt)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <p className="text-caption text-ink-secondary">
        {entry.status && lessonStatus[entry.status].label}
        {entry.status && entry.homework && " · "}
        {entry.homework && (
          <span className={entry.homework === NEEDS_ATTENTION ? "font-semibold text-ink" : undefined}>
            {homeworkChipLabel[entry.homework]}
          </span>
        )}
      </p>
    </Link>
  );
}
