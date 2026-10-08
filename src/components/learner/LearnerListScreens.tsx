"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ClipboardList, History, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buttonClass } from "@/components/ui/Button";
import { homeworkStatus } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { contextHref, useActiveLearner } from "@/lib/context";
import { getHomework, getLessonHistory } from "@/lib/domain";
import { learnerTypeLabel } from "@/lib/learners";
import { useStore } from "@/lib/store";
import type { HomeworkStatus, Learner } from "@/lib/types";
import { HistoryCard, HomeworkCard } from "./LearnerCards";

/** Frame for a learner's full list: breadcrumbs back to the learner, title, identity. */
function LearnerListFrame({
  title,
  render,
}: {
  title: string;
  render: (learner: Learner) => ReactNode;
}) {
  const learner = useActiveLearner();

  if (!learner) {
    return (
      <EmptyState
        icon={<Users size={28} strokeWidth={1.5} aria-hidden />}
        title="Ученик не выбран"
        description="Откройте ученика в библиотеке, чтобы посмотреть его задания и историю."
        action={
          <Link href="/library" className={buttonClass("secondary")}>
            В библиотеку
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        <Breadcrumbs items={[{ label: learner.name, href: contextHref("/library", learner.id) }]} current={title} />
        <div className="flex items-center gap-4">
          <Avatar learner={learner} size="xl" />
          <div>
            <h1 className="text-h1">{title}</h1>
            <p className="mt-1 text-ink-secondary">
              {learner.name} · {learnerTypeLabel(learner)}
            </p>
          </div>
        </div>
      </header>
      {render(learner)}
    </div>
  );
}

type HomeworkFilter = "all" | HomeworkStatus;

/** Spec §10.4: full homework list, filterable by status. Completed and reviewed stay here. */
export function HomeworkScreen() {
  return <LearnerListFrame title="Домашние задания" render={(learner) => <HomeworkList learner={learner} />} />;
}

function HomeworkList({ learner }: { learner: Learner }) {
  const data = useStore((s) => s.data);
  const [filter, setFilter] = useState<HomeworkFilter>("all");
  const all = getHomework(data, learner.id);
  const shown = filter === "all" ? all : all.filter((h) => h.status === filter);
  const countOf = (status: HomeworkStatus) => all.filter((h) => h.status === status).length;

  if (all.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList size={28} strokeWidth={1.5} aria-hidden />}
        title="Заданий пока нет"
        description="Откройте урок с учеником и назначьте задание — оно появится здесь."
      />
    );
  }

  return (
    <>
      <FilterChips
        label="Статус задания"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "Все", count: all.length },
          ...(["assigned", "completed", "reviewed"] as const).map((status) => ({
            value: status,
            label: homeworkStatus[status].label,
            count: countOf(status),
          })),
        ]}
      />
      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong px-5 py-4 text-ink-secondary">
          С таким статусом заданий нет.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((hw) => (
            <HomeworkCard key={hw.id} homework={hw} />
          ))}
        </div>
      )}
    </>
  );
}

/** Spec §9: every lesson used with the learner, newest activity first. */
export function HistoryScreen() {
  return <LearnerListFrame title="История уроков" render={(learner) => <HistoryList learner={learner} />} />;
}

function HistoryList({ learner }: { learner: Learner }) {
  const data = useStore((s) => s.data);
  const history = getLessonHistory(data, learner.id);

  if (history.length === 0) {
    return (
      <EmptyState
        icon={<History size={28} strokeWidth={1.5} aria-hidden />}
        title="Занятий пока не было"
        description="Начните урок с учеником — он появится в истории."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {history.map((entry) => (
        <HistoryCard key={entry.learnerLesson.id} entry={entry} learnerId={learner.id} />
      ))}
    </div>
  );
}
