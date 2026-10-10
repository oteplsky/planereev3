"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { homeworkStatus } from "@/components/ui/Badge";
import { FilterChips } from "@/components/ui/FilterChips";
import { getCurrentSession, getLessonHistory, type HistoryEntry } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { HomeworkStatus, Learner } from "@/lib/types";
import { CurrentLesson, HistoryChip } from "./LearnerCards";

/** At most this many recent lessons, and only as many as fit on one row; the rest is in the modal. */
const RECENT = 5;
const GAP = 8;

/** Learner layer above the shared library (spec §7.1): current lesson and lesson history with homework marks. */
export function LearnerWorkspace({ learner }: { learner: Learner }) {
  const data = useStore((s) => s.data);
  const [showAll, setShowAll] = useState(false);
  const current = getCurrentSession(data, learner.id);
  const history = getLessonHistory(data, learner.id);

  return (
    <div className="flex flex-col gap-10">
      <CurrentLesson session={current} />

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
      <ChipList entries={history.slice(0, fit)} learnerId={learnerId} nowrap>
        {hidden > 0 && <li className="shrink-0">{more(`Ещё ${hidden}`)}</li>}
      </ChipList>
    </div>
  );
}

function ChipList({
  entries,
  learnerId,
  nowrap = false,
  children,
}: {
  entries: HistoryEntry[];
  learnerId: string;
  nowrap?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <ul className={`flex gap-2 ${nowrap ? "" : "flex-wrap"}`}>
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
      <div className="max-h-[60vh] overflow-y-auto">
        <ChipList entries={shown} learnerId={learnerId} />
      </div>
    </div>
  );
}
