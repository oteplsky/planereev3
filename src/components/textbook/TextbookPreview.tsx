import type { ReactNode } from "react";
import { AuthorLine } from "@/components/library/AuthorLine";
import { Cover } from "@/components/library/Cover";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { lessonNumbers, textbookLessons, type Materials } from "@/lib/domain";
import { metaSummary } from "@/lib/meta";
import type { Author, Lesson, Textbook } from "@/lib/types";
import { LessonRow } from "./TextbookScreen";

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
  const lessonList = (lessons: Lesson[]) => (
    <ol className="flex flex-col gap-2">
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
