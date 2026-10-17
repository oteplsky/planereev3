"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import Link from "next/link";
import { homeworkStatus, LessonStatusChips } from "@/components/ui/Badge";
import { FilterChips } from "@/components/ui/FilterChips";
import { contextHref } from "@/lib/context";
import { getCurrentSession, getLessonHistory, learnerTextbooks, type HistoryEntry } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { HomeworkStatus, Learner } from "@/lib/types";
import { CurrentLesson, HistoryChip } from "./LearnerCards";
import { NextLesson } from "./NextLesson";

/** At most this many recent lessons, and only as many as fit on one row; the rest is in the modal. */
const RECENT = 5;
const GAP = 8;

/**
 * Learner layer above the shared library (spec §7.1): the current lesson — or, when none is in progress,
 * the next one — then lesson history with homework marks.
 */
export function LearnerWorkspace({ learner }: { learner: Learner }) {
  const data = useStore((s) => s.data);
  const [showAll, setShowAll] = useState(false);
  const current = getCurrentSession(data, learner.id);
  const history = getLessonHistory(data, learner.id);
  const upNext = learnerTextbooks(data, learner.id).find((p) => p.next);

  return (
    <div className="flex flex-col gap-10">
      {!current && upNext?.next ? (
        <NextLesson learner={learner} progress={upNext} lesson={upNext.next} />
      ) : (
        <CurrentLesson session={current} />
      )}

      {history.length > 0 && (
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-4 text-h2">
            История уроков
          </h2>
          <RecentRow history={history} learnerId={learner.id} onMore={() => setShowAll(true)} />
          <Dialog open={showAll} onClose={() => setShowAll(false)} title="История уроков" wide>
            <FullHistory history={history} learnerId={learner.id} />
          </Dialog>
        </section>
      )}
    </div>
  );
}

/**
 * One row of the latest lessons. Chips are measured off-screen so the row shows
 * as many as fit next to «Ещё N» — 5 on a wide screen, fewer on a narrow one.
 */
function RecentRow({ history, learnerId, onMore }: { history: HistoryEntry[]; learnerId: string; onMore: () => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const candidates = history.slice(0, RECENT);
  const [fit, setFit] = useState(candidates.length);
  const candidateKey = candidates.map((e) => e.learnerLesson.id).join();

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const update = () => {
      const items = [...measure.children] as HTMLElement[];
      const chipWidths = items.slice(0, -1).map((el) => el.offsetWidth);
      const moreWidth = items.at(-1)!.offsetWidth;
      let used = 0;
      let count = 0;
      for (const [i, width] of chipWidths.entries()) {
        const needsMore = i + 1 < history.length;
        const next = used + (count ? GAP : 0) + width;
        if (next + (needsMore ? GAP + moreWidth : 0) > row.clientWidth) break;
        used = next;
        count++;
      }
      setFit(Math.max(1, count));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => observer.disconnect();
  }, [history.length, candidateKey]);

  const hidden = history.length - fit;
  const more = (label: string) => (
    <button
      type="button"
      onClick={onMore}
      className="flex h-10 shrink-0 items-center rounded-full bg-light px-4 font-semibold whitespace-nowrap transition-colors duration-[120ms] hover:bg-light-hover active:bg-light-pressed"
    >
      {label}
    </button>
  );

  return (
    <div ref={rowRef} className="relative">
      {/* Off-screen copy for measuring natural chip widths. */}
      <div aria-hidden inert className="pointer-events-none invisible absolute size-0 overflow-hidden">
        <ul ref={measureRef} className="flex w-max gap-2 whitespace-nowrap">
          {candidates.map((entry) => (
            <li key={entry.learnerLesson.id}>
              <HistoryChip entry={entry} learnerId={learnerId} />
            </li>
          ))}
          <li>{more(`Ещё ${history.length}`)}</li>
        </ul>
      </div>
      <ChipList entries={history.slice(0, fit)} learnerId={learnerId}>
        {hidden > 0 && <li className="shrink-0">{more(`Ещё ${hidden}`)}</li>}
      </ChipList>
    </div>
  );
}

function ChipList({ entries, learnerId, children }: { entries: HistoryEntry[]; learnerId: string; children?: React.ReactNode }) {
  return (
    <ul className="flex gap-2">
      {entries.map((entry) => (
        <li key={entry.learnerLesson.id} className="max-w-full min-w-0">
          <HistoryChip entry={entry} learnerId={learnerId} />
        </li>
      ))}
      {children}
    </ul>
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

/** A line in the full history: title, where it's from and when, then the lesson and homework chips. */
function HistoryRow({ entry, learnerId }: { entry: HistoryEntry; learnerId: string }) {
  return (
    <Link
      href={contextHref(`/lesson/${entry.lesson.id}`, learnerId)}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md px-2 py-3 transition-colors duration-[120ms] hover:bg-hover"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{entry.lesson.title}</p>
        <p className="truncate text-caption text-ink-secondary">
          {[entry.textbook?.title, formatDate(entry.lastActivityAt)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <LessonStatusChips lesson={entry.status} homework={entry.homework} />
    </Link>
  );
}
