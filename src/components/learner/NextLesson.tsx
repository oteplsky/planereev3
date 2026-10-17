"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { contextHref } from "@/lib/context";
import type { TextbookProgress } from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { Learner, Lesson } from "@/lib/types";

/**
 * Shown in place of the current lesson when nothing is in progress: the next lesson of the textbook
 * the learner worked with most recently. The title opens the lesson to look it over or adapt it first.
 */
export function NextLesson({ learner, progress, lesson }: { learner: Learner; progress: TextbookProgress; lesson: Lesson }) {
  const startLesson = useStore((s) => s.startLesson);
  return (
    <div className="relative flex flex-wrap items-center gap-4 rounded-lg border border-line px-5 py-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-light text-action">
        <ArrowRight size={20} strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-bold tracking-wider text-ink-secondary uppercase">Следующий урок</p>
        <Link
          href={contextHref(`/lesson/${lesson.id}`, learner.id)}
          className="mt-0.5 block truncate rounded-xs text-h3 underline-offset-4 hover:text-action hover:underline"
        >
          {lesson.title}
        </Link>
        <p className="text-ink-secondary">{progress.textbook.title}</p>
      </div>
      <Button
        variant="primary"
        size="lg"
        icon={<Play size={18} strokeWidth={2} aria-hidden />}
        onClick={() => {
          startLesson(learner.id, lesson.id);
          toast("Урок начат");
        }}
      >
        Начать урок
      </Button>
    </div>
  );
}
