"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { LearnerSelector } from "@/components/LearnerSelector";
import { FormatChips, LearnerProfile, quietChip } from "@/components/learner/LearnerProfile";
import { LearnerActions } from "@/components/learner/LearnerWorkspace";
import { Library } from "@/components/library/Library";
import { Avatar } from "@/components/ui/Avatar";
import { contextHref, useActiveLearner } from "@/lib/context";
import { learnerTypeLabel, membersOf } from "@/lib/learners";
import { useStore } from "@/lib/store";
import type { Learner } from "@/lib/types";

/** The Library page in either context. Learner sections are an extra layer above the same library. */
export function LibraryScreen() {
  const learner = useActiveLearner();
  const folderId = useSearchParams().get("folder");

  return (
    <div className="flex flex-col gap-10">
      <LearnerSelector activeLearnerId={learner?.id ?? null} />
      {/* The selector already says where we are; the global library needs no visible title. */}
      {learner ? <LearnerHeader key={learner.id} learner={learner} /> : <h1 className="sr-only">Библиотека</h1>}

      <Library key={folderId ?? "root"} learner={learner} folderId={folderId} />
    </div>
  );
}

function LearnerHeader({ learner }: { learner: Learner }) {
  return learner.type === "group" ? <GroupHeader group={learner} /> : <StudentHeader student={learner} />;
}

/** Name with quiet context chips under it, and the learner's one main action on the right. */
function HeaderRow({ learner, title, chips }: { learner: Learner; title: ReactNode; chips: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col items-start gap-2">
        <h1 className="min-w-0 text-h2">{title}</h1>
        {chips}
      </div>
      <LearnerActions learner={learner} />
    </div>
  );
}

/** Avatar and name open the profile; chips say how the student studies. */
function StudentHeader({ student }: { student: Learner }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <header>
      <HeaderRow
        learner={student}
        title={
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label={`${student.name}: открыть профиль`}
            className="group -m-1.5 flex items-center gap-3 rounded-lg p-1.5 text-left transition-colors duration-[120ms] hover:bg-hover"
          >
            <Avatar learner={student} size="lg" />
            <span className="truncate">{student.name}</span>
            <ChevronRight
              size={20}
              strokeWidth={2}
              className="-ml-1 shrink-0 text-ink-secondary transition-transform duration-[120ms] group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        }
        chips={<FormatChips learner={student} />}
      />
      <LearnerProfile learner={student} open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}

/** A group lists its students; each opens that student's own page. Membership is managed in the CRM. */
function GroupHeader({ group }: { group: Learner }) {
  const data = useStore((s) => s.data);
  const members = membersOf(data, group);
  return (
    <header className="flex flex-col gap-4">
      <HeaderRow
        learner={group}
        title={
          <span className="flex items-center gap-3">
            <Avatar learner={group} size="lg" />
            <span className="truncate">{group.name}</span>
          </span>
        }
        chips={<span className={quietChip}>{learnerTypeLabel(group)}</span>}
      />
      <ul className="flex flex-wrap gap-2" aria-label="Ученики группы">
        {members.map((m) => (
          <li key={m.id}>
            <Link
              href={contextHref("/library", m.id)}
              className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface pr-4 pl-1 font-semibold transition-colors duration-[120ms] hover:border-line-strong hover:text-action"
            >
              <Avatar learner={m} size="sm" />
              {m.name}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
}
