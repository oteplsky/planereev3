"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buttonClass } from "@/components/ui/Button";
import { contextHref, useActiveLearner } from "@/lib/context";
import { resolveLesson } from "@/lib/domain";
import { dative, genitive } from "@/lib/learners";
import { useStore } from "@/lib/store";

/**
 * Live lesson belongs to another product area. Until it exists, «Продолжить урок» lands
 * here: a system state (UI kit · Состояния) — what's happening, what's kept, one way back.
 */
export function LiveLessonScreen() {
  const learner = useActiveLearner();
  const lessonId = useSearchParams().get("lesson");
  const learnerId = learner?.id ?? null;
  const data = useStore((s) => s.data);
  const lesson = lessonId ? (resolveLesson(data, lessonId, learnerId)?.lesson ?? null) : null;
  const backHref = contextHref("/library", learnerId);

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs
        items={[{ label: learner ? learner.name : "Библиотека", href: backHref }]}
        current={lesson?.title ?? "Урок"}
      />

      <section className="flex flex-col items-center rounded-lg border border-line px-6 py-12 text-center sm:py-16">
        <UnfinishedRibbon />
        <h1 className="mt-8 text-h1">Этот функционал пока строится</h1>
        {learner && (
          <p className="mt-2 max-w-md text-body-lg text-ink-secondary">
            Уроки и домашка {genitive(learner)} на месте.
          </p>
        )}
        <Link href={backHref} className={`${buttonClass("primary", "lg")} mt-8`}>
          {learner ? `Вернуться к ${dative(learner)}` : "В библиотеку"}
        </Link>
      </section>
    </div>
  );
}

/**
 * Brand ribbon still being laid, and no lime dot yet — in the brand story the dot means
 * the work is done (brand · Суть бренда). Its future place is only outlined.
 */
function UnfinishedRibbon() {
  return (
    <div aria-hidden className="relative aspect-[2/1] w-full max-w-sm overflow-hidden rounded-md bg-light">
      <svg viewBox="0 0 320 160" className="absolute inset-0 size-full">
        <path
          d="M-10 120 C 50 70, 100 150, 160 100 S 250 40, 300 70"
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          className="text-blue-bg"
        />
        <path
          d="M-10 70 C 50 20, 110 110, 170 62 S 250 20, 290 40"
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
          className="animate-[ribbon-draw_1.6s_cubic-bezier(0.22,1,0.36,1)_both] text-action [stroke-dasharray:1] [stroke-dashoffset:0.38]"
        />
        <circle cx="272" cy="118" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 5" className="text-neutral-350" />
      </svg>
    </div>
  );
}
