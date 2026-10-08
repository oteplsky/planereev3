"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { contextHref, useActiveLearner } from "@/lib/context";
import { useStore } from "@/lib/store";

/** Temporary target for textbook and lesson links until Steps 4 and 6. */
export function ComingSoon({ kind }: { kind: "textbook" | "lesson" }) {
  const { id } = useParams<{ id: string }>();
  const learner = useActiveLearner();
  const title = useStore((s) =>
    kind === "textbook"
      ? s.data.textbooks.find((t) => t.id === id)?.title
      : s.data.lessons.find((l) => l.id === id)?.title,
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={contextHref("/library", learner?.id ?? null)}
        className="flex w-fit items-center gap-2 rounded-sm font-semibold text-ink-secondary hover:text-action"
      >
        <ArrowLeft size={20} strokeWidth={1.75} aria-hidden /> Библиотека
      </Link>
      <h1 className="text-h1">{title ?? "Не найдено"}</h1>
      <div className="grid h-64 place-items-center rounded-lg border border-dashed border-line-strong text-ink-secondary">
        {kind === "textbook" ? "Содержание учебника появится на шаге 4" : "Пространство урока появится на шаге 6"}
      </div>
    </div>
  );
}
