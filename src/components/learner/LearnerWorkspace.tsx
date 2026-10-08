"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { contextHref } from "@/lib/context";
import { getCurrentSession, getHomework, getLessonHistory } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { Learner } from "@/lib/types";
import { CurrentLesson, HistoryCard, HomeworkCard } from "./LearnerCards";

const RECENT = 3;

/** Learner layer above the shared library (spec §7.1): current lesson, homework, history. */
export function LearnerWorkspace({ learner }: { learner: Learner }) {
  const data = useStore((s) => s.data);
  const current = getCurrentSession(data, learner.id);
  const homework = getHomework(data, learner.id);
  const history = getLessonHistory(data, learner.id);

  return (
    <div className="flex flex-col gap-10">
      <CurrentLesson session={current} />

      <section aria-labelledby="homework-heading">
        <SectionHeader
          id="homework-heading"
          title="Домашние задания"
          total={homework.length}
          moreLabel="Все задания"
          moreHref={contextHref("/homework", learner.id)}
        />
        {homework.length === 0 ? (
          <Quiet>Заданий пока нет. Их можно назначить из урока.</Quiet>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {homework.slice(0, RECENT).map((hw) => (
              <HomeworkCard key={hw.id} homework={hw} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="history-heading">
        <SectionHeader
          id="history-heading"
          title="История уроков"
          total={history.length}
          moreLabel="Вся история"
          moreHref={contextHref("/history", learner.id)}
        />
        {history.length === 0 ? (
          <Quiet>Занятий пока не было. Начатые уроки появятся здесь.</Quiet>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.slice(0, RECENT).map((entry) => (
              <HistoryCard key={entry.learnerLesson.id} entry={entry} learnerId={learner.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  id,
  title,
  total,
  moreLabel,
  moreHref,
}: {
  id: string;
  title: string;
  total: number;
  moreLabel: string;
  moreHref: string;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 id={id} className="flex items-baseline gap-2 text-h2">
        {title}
        {total > 0 && <span className="text-body-lg font-semibold text-neutral-400">{total}</span>}
      </h2>
      {total > 0 && (
        <Link href={moreHref} className="flex items-center gap-1 rounded-xs font-semibold text-action hover:text-action-hover">
          {moreLabel} <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
        </Link>
      )}
    </div>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line-strong px-5 py-4 text-ink-secondary">{children}</p>;
}
