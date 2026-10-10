"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Plus, X } from "lucide-react";
import { LearnerSelector } from "@/components/LearnerSelector";
import { AddMembersDialog } from "@/components/learner/AddMembersDialog";
import { FormatChips, LearnerProfile } from "@/components/learner/LearnerProfile";
import { LearnerWorkspace } from "@/components/learner/LearnerWorkspace";
import { Library } from "@/components/library/Library";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/components/ui/Toast";
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

      {learner && <LearnerWorkspace learner={learner} />}
      <Library key={folderId ?? "root"} learner={learner} folderId={folderId} />
    </div>
  );
}

function LearnerHeader({ learner }: { learner: Learner }) {
  return learner.type === "group" ? <GroupHeader group={learner} /> : <StudentHeader student={learner} />;
}

/** Avatar and name open the profile; chips say how the student studies. */
function StudentHeader({ student }: { student: Learner }) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <header className="flex flex-col items-start gap-3">
      <h1 className="text-h1">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label={`${student.name}: открыть профиль`}
          className="group -m-2 flex items-center gap-4 rounded-lg p-2 text-left transition-colors duration-[120ms] hover:bg-hover"
        >
          <Avatar learner={student} size="xl" />
          <span>{student.name}</span>
          <ChevronRight
            size={28}
            strokeWidth={2}
            className="-ml-2 text-ink-secondary transition-transform duration-[120ms] group-hover:translate-x-0.5"
            aria-hidden
          />
        </button>
      </h1>
      <FormatChips learner={student} />
      <LearnerProfile learner={student} open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}

/** A group lists its students; each opens that student's own page. */
function GroupHeader({ group }: { group: Learner }) {
  const data = useStore((s) => s.data);
  const members = membersOf(data, group);
  const [adding, setAdding] = useState(false);
  const removeGroupMember = useStore((s) => s.removeGroupMember);
  const addGroupMembers = useStore((s) => s.addGroupMembers);
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar learner={group} size="xl" />
        <div className="min-w-0">
          <h1 className="text-h1">{group.name}</h1>
          <p className="mt-1 text-body text-ink-secondary">{learnerTypeLabel(group)}</p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label="Ученики группы">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex h-10 items-center rounded-full border border-line bg-surface transition-colors duration-[120ms] hover:border-line-strong"
          >
            <Link
              href={contextHref("/library", m.id)}
              className="flex h-full items-center gap-2 rounded-l-full pr-1 pl-1 font-semibold hover:text-action"
            >
              <Avatar learner={m} size="sm" />
              {m.name}
            </Link>
            <button
              type="button"
              aria-label={`Убрать из группы: ${m.name}`}
              title="Убрать из группы"
              onClick={() => {
                removeGroupMember(group.id, m.id);
                toast(`${m.name} больше не в группе`, {
                  label: "Вернуть",
                  onClick: () => addGroupMembers(group.id, [m.id]),
                });
              }}
              className="mr-1 grid size-8 place-items-center rounded-full text-ink-secondary transition-colors duration-[120ms] hover:bg-light hover:text-ink"
            >
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-10 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-4 font-semibold text-ink-secondary transition-colors duration-[120ms] hover:border-action hover:bg-selected hover:text-action"
          >
            <Plus size={18} strokeWidth={2} aria-hidden />
            Добавить ученика
          </button>
        </li>
      </ul>
      <AddMembersDialog group={group} open={adding} onClose={() => setAdding(false)} />
    </header>
  );
}
