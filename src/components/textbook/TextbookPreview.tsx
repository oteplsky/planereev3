"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AuthorLine } from "@/components/library/AuthorLine";
import { Cover } from "@/components/library/Cover";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { lessonNumbers, textbookLessons, type Materials } from "@/lib/domain";
import { metaSummary } from "@/lib/meta";
import type { Author, Lesson, Textbook } from "@/lib/types";
import { LessonRow, useCollapsedSections } from "./TextbookScreen";

interface TextbookPreviewProps {
  materials: Materials;
  textbook: Textbook;
  author: Author | null;
  /** Omitted where there is no way back, e.g. a shared link opened on its own. */
  crumbs?: Crumb[];
  /** «Добавить в библиотеку», «Сохранить себе». */
  action?: ReactNode;
  lessonHref: (lesson: Lesson) => string;
}

/** Read-only textbook: what's inside someone else's textbook (the catalog, a shared link). */
export function TextbookPreview({ materials, textbook, author, crumbs, action, lessonHref }: TextbookPreviewProps) {
  const { sections, loose } = textbookLessons(materials, textbook);
  const numbers = lessonNumbers(materials, textbook);
  const summary = metaSummary(textbook.meta);
  const folds = useCollapsedSections(textbook.id);
  const lessonList = (lessons: Lesson[]) => (
    <ol className="flex flex-col gap-1">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <LessonRow lesson={lesson} number={numbers.get(lesson.id)!} href={lessonHref(lesson)} />
        </li>
      ))}
    </ol>
  );

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-5">
        {crumbs && <Breadcrumbs items={crumbs} current={textbook.title} />}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="w-40 shrink-0 overflow-hidden rounded-lg border border-line sm:w-48">
            <Cover cover={textbook.cover} kind="textbook" image={textbook.coverImage} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <h1 className="text-h1">{textbook.title}</h1>
            <AuthorLine author={author} />
            {summary && <p className="font-semibold text-ink-secondary">{summary}</p>}
            {textbook.description && <p className="mt-1 max-w-2xl whitespace-pre-line">{textbook.description}</p>}
            {action && <div className="mt-3">{action}</div>}
          </div>
        </div>
      </header>

      <section aria-label="Содержание учебника" className="flex flex-col gap-4">
        {loose.length > 0 && lessonList(loose)}
        {sections.map(({ section, lessons }) => {
          const collapsed = folds.isCollapsed(section.id);
          return (
            <section key={section.id} aria-labelledby={`sec-${section.id}`} className="border-t border-line">
              <h2 id={`sec-${section.id}`} className="py-3 text-h3">
                <button
                  type="button"
                  aria-expanded={!collapsed}
                  aria-controls={`sec-body-${section.id}`}
                  onClick={() => folds.toggle(section.id)}
                  className="flex w-full items-center gap-3 rounded-sm pl-1 text-left"
                >
                  <span className="min-w-0 flex-1">{section.title}</span>
                  <ChevronDown
                    size={20}
                    strokeWidth={1.75}
                    className={`shrink-0 text-ink-secondary transition-transform duration-[120ms] ${collapsed ? "-rotate-90" : ""}`}
                    aria-hidden
                  />
                </button>
              </h2>
              {!collapsed && (
                <div id={`sec-body-${section.id}`} className="pb-3">
                  {lessonList(lessons)}
                </div>
              )}
            </section>
          );
        })}
      </section>
    </div>
  );
}
