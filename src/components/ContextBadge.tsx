import { LibraryBig } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { forLearner } from "@/lib/learners";
import type { Learner } from "@/lib/types";

/**
 * Says whose material is on screen (spec §3.4, §16.4): the shared library or a
 * specific learner. Shown on textbook and lesson screens.
 */
export function ContextBadge({
  learner,
  globalLabel = "Общий материал",
  learnerLabel,
}: {
  learner: Learner | null;
  globalLabel?: string;
  /** Defaults to «Версия для Анны». */
  learnerLabel?: string;
}) {
  if (!learner) {
    return (
      <span className="inline-flex h-8 w-max items-center gap-2 rounded-full bg-light pr-3.5 pl-1 font-semibold">
        <span className="grid size-6 place-items-center rounded-full bg-action text-white">
          <LibraryBig size={14} strokeWidth={2} aria-hidden />
        </span>
        {globalLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-max items-center gap-2 rounded-full bg-selected pr-3.5 pl-1 font-semibold text-ink">
      <Avatar learner={learner} size="sm" className="scale-75" />
      {learnerLabel ?? `Версия ${forLearner(learner)}`}
    </span>
  );
}
