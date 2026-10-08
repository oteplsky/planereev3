"use client";

import { useSearchParams } from "next/navigation";
import { LearnerSelector } from "@/components/LearnerSelector";
import { Library } from "@/components/library/Library";
import { Avatar } from "@/components/ui/Avatar";
import { useActiveLearner } from "@/lib/context";
import { learnerTypeLabel } from "@/lib/learners";
import type { Learner } from "@/lib/types";

/** The Library page in either context. Learner sections are an extra layer above the same library. */
export function LibraryScreen() {
  const learner = useActiveLearner();
  const folderId = useSearchParams().get("folder");

  return (
    <div className="flex flex-col gap-10">
      <LearnerSelector activeLearnerId={learner?.id ?? null} />
      {learner ? <LearnerHeader learner={learner} /> : <GlobalHeader />}

      {/* Step 5 adds the learner's current lesson, homework and history here. */}
      <Library key={folderId ?? "root"} learner={learner} folderId={folderId} />
    </div>
  );
}

function GlobalHeader() {
  return (
    <header>
      <h1 className="text-h1">Библиотека</h1>
      <p className="mt-2 max-w-2xl text-body-lg text-ink-secondary">
        Все ваши учебники и уроки. Отсюда материалы кладутся на парты учеников.
      </p>
    </header>
  );
}

function LearnerHeader({ learner }: { learner: Learner }) {
  return (
    <header className="flex items-center gap-4">
      <Avatar learner={learner} size="xl" />
      <div className="min-w-0">
        <h1 className="text-h1">{learner.name}</h1>
        <p className="mt-1 text-body text-ink-secondary">
          {learnerTypeLabel(learner)}
          {learner.members?.length ? ` · ${learner.members.join(", ")}` : null}
        </p>
      </div>
    </header>
  );
}
