"use client";

import { useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { homeworkChipLabel, homeworkStatus, lessonStatus } from "@/components/ui/Badge";
import { FilterChips } from "@/components/ui/FilterChips";
import { contextHref } from "@/lib/context";
import { getCurrentSession, getLessonHistory, learnerTextbooks, type HistoryEntry } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { HomeworkStatus, Learner } from "@/lib/types";
import { CurrentLesson } from "./LearnerCards";
import { NextLesson } from "./NextLesson";

/** Homework in this status waits for the teacher, so it is the one thing the history button counts. */
const NEEDS_ATTENTION: HomeworkStatus = "completed";

/**
 * Learner layer above the shared library (spec §7.1): the current lesson — or, when none is in progress,
 * the next one. Lesson history stays one quiet click away, counting only homework that waits for the teacher.
 */
export function LearnerWorkspace({ learner }: { learner: Learner }) {
  const data = useStore((s) => s.data);
  const [showAll, setShowAll] = useState(false);
  const current = getCurrentSession(data, learner.id);
  const history = getLessonHistory(data, learner.id);
  const upNext = learnerTextbooks(data, learner.id).find((p) => p.next);
  const waiting = history.filter((h) => h.homework === NEEDS_ATTENTION).length;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="w-full">
        {!current && upNext?.next ? (
          <NextLesson learner={learner} progress={upNext} lesson={upNext.next} />
        ) : (
          <CurrentLesson session={current} />
        )}
      </div>

      {history.length > 0 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            icon={<History size={16} strokeWidth={1.75} aria-hidden />}
            aria-label={waiting > 0 ? `История уроков, ${waiting} ${homeworkWord(waiting)} ждут проверки` : undefined}
            onClick={() => setShowAll(true)}
            className="text-ink-secondary hover:text-ink"
          >
            История уроков
            {waiting > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-caption font-bold text-surface">
                {waiting}
              </span>
            )}
          </Button>
          <Dialog open={showAll} onClose={() => setShowAll(false)} title="История уроков" wide>
            <FullHistory history={history} learnerId={learner.id} />
          </Dialog>
        </>
      )}
    </div>
  );
}

function homeworkWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "домашка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "домашки";
  return "домашек";
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
