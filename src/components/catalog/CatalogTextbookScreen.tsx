"use client";

import { useParams, useRouter } from "next/navigation";
import { BookX } from "lucide-react";
import { AuthorLine } from "@/components/library/AuthorLine";
import { Cover } from "@/components/library/Cover";
import { LessonRow } from "@/components/textbook/TextbookScreen";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { catalog } from "@/lib/catalog";
import { catalogHref, contextHref, useReturnLearner } from "@/lib/context";
import { textbookLessons } from "@/lib/domain";
import { metaSummary } from "@/lib/meta";
import type { Learner, Lesson } from "@/lib/types";
import { AddToLibrary } from "./AddToLibrary";

/** «Анна › Готовые материалы»: the way back to the learner the teacher came from, then the catalog. */
export function catalogCrumbs(from: Learner | null): Crumb[] {
  return [
    ...(from ? [{ label: from.name, href: contextHref("/library", from.id) }] : []),
    { label: "Готовые материалы", href: catalogHref("/catalog", from?.id ?? null) },
  ];
}

/** Read-only preview of a catalog textbook: what's inside before adding it to the library. */
export function CatalogTextbookScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const from = useReturnLearner();
  const fromId = from?.id ?? null;
  const textbook = catalog.textbooks.find((t) => t.id === id);

  if (!textbook) {
    return (
      <EmptyState
        icon={<BookX size={28} strokeWidth={1.5} aria-hidden />}
        title="Учебник не найден"
        description="Возможно, его убрали из готовых материалов."
        action={<Button onClick={() => router.push(catalogHref("/catalog", fromId))}>К готовым материалам</Button>}
      />
    );
  }

  const { sections, loose } = textbookLessons(catalog, textbook);
  const ordered = textbook.useSections ? sections.flatMap((s) => s.lessons) : loose;
  const summary = metaSummary(textbook.meta);
  const lessonList = (lessons: Lesson[]) => (
    <ol className="flex flex-col gap-2">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <LessonRow
            lesson={lesson}
            number={ordered.indexOf(lesson) + 1}
            href={catalogHref(`/catalog/${textbook.id}/lesson/${lesson.id}`, fromId)}
          />
        </li>
      ))}
    </ol>
  );

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-5">
        <Breadcrumbs items={catalogCrumbs(from)} current={textbook.title} />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="w-40 shrink-0 overflow-hidden rounded-lg border border-line sm:w-48">
            <Cover cover={textbook.cover} kind="textbook" image={textbook.coverImage} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <h1 className="text-h1">{textbook.title}</h1>
            <AuthorLine author={textbook.author} />
            {summary && <p className="font-semibold text-ink-secondary">{summary}</p>}
            {textbook.description && <p className="mt-1 max-w-2xl whitespace-pre-line">{textbook.description}</p>}
            <div className="mt-3">
              <AddToLibrary catalogTextbookId={textbook.id} from={from} />
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Содержание учебника" className="flex flex-col gap-4">
        {textbook.useSections
          ? sections.map(({ section, lessons }) => (
              <section key={section.id} aria-labelledby={`sec-${section.id}`} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:p-5">
                <h2 id={`sec-${section.id}`} className="text-h3">
                  {section.title}
                </h2>
                {lessonList(lessons)}
              </section>
            ))
          : lessonList(loose)}
      </section>
    </div>
  );
}
