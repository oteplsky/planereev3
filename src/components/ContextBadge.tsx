import { LibraryBig } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { forLearner } from "@/lib/learners";
import type { Learner } from "@/lib/types";

/**
 * Says whose material is on screen (spec §3.4, §16.4): the shared library or a specific learner.
 * Quiet text at the start of the lesson's status line; the learner's avatar is the one mark of colour.
 */
export function ContextBadge({ learner }: { learner: Learner | null }) {
  if (!learner) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <LibraryBig size={18} strokeWidth={1.75} aria-hidden />
        Общий материал
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar learner={learner} size="sm" className="-my-1 scale-75" />
      Версия {forLearner(learner)}
    </span>
  );
}
