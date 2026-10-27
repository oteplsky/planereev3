"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookmarkPlus, BookX, FileX } from "lucide-react";
import { InLibraryChip } from "@/components/catalog/AddToLibrary";
import { BlockView } from "@/components/lesson/LessonBlocks";
import { TextbookPreview } from "@/components/textbook/TextbookPreview";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { lessonFromShare, shareStatus, sharedAuthor, sharedLessonAuthor, textbookFromShare } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { sharedHref, sharedTextbookLessonHref, type ShareAccess, type ShareTarget } from "@/lib/share";
import type { Lesson } from "@/lib/types";
import { AuthorLine } from "@/components/library/AuthorLine";
import type { Crumb } from "@/components/ui/Breadcrumbs";

/** Prototype: anything but an explicit «save» link is view-only. */
function useAccess(): ShareAccess {
  return useSearchParams().get("access") === "save" ? "save" : "view";
}

/** A textbook opened from a shared link. Read-only; a «С сохранением» link also lets the recipient keep a copy. */
export function SharedTextbookScreen() {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const data = useStore((s) => s.data);
  const textbook = data.textbooks.find((t) => t.id === id);
  // Only own material is shared, even if the link is typed in by hand.
  if (!textbook || shareStatus(data, "textbook", id) !== "own") return <Missing kind="textbook" />;

  return (
    <TextbookPreview
      materials={data}
      textbook={textbook}
      author={sharedAuthor(data, textbook)}
      action={access === "save" && <SaveShared target={{ kind: "textbook", id: textbook.id }} />}
      lessonHref={(lesson) => sharedTextbookLessonHref(textbook.id, lesson.id, access)}
    />
  );
}

/** One lesson of a shared textbook. Saving takes the whole textbook. */
export function SharedLessonScreen() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const access = useAccess();
  const data = useStore((s) => s.data);
  const textbook = data.textbooks.find((t) => t.id === id);
  const lesson = data.lessons.find((l) => l.id === lessonId && l.textbookId === id);
  if (!textbook || !lesson || shareStatus(data, "textbook", id) !== "own") return <Missing kind="lesson" />;

  return (
    <LessonPreview
      lesson={lesson}
      crumbs={[{ label: textbook.title, href: sharedHref({ kind: "textbook", id: textbook.id }, access) }]}
      action={access === "save" && <SaveShared target={{ kind: "textbook", id: textbook.id }} />}
    />
  );
}

/** One lesson shared on its own, wherever it sits in the sender's library. */
export function SharedStandaloneLessonScreen() {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const data = useStore((s) => s.data);
  const lesson = data.lessons.find((l) => l.id === id);

  if (!lesson || shareStatus(data, "lesson", id) !== "own") return <Missing kind="lesson" />;

  return (
    <LessonPreview
      lesson={lesson}
      author={<AuthorLine author={sharedLessonAuthor(data, lesson)} />}
      action={access === "save" && <SaveShared target={{ kind: "lesson", id: lesson.id }} />}
    />
  );
}

function LessonPreview({ lesson, crumbs, author, action }: { lesson: Lesson; crumbs?: Crumb[]; author?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        {crumbs && <Breadcrumbs items={crumbs} current={lesson.title} />}
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-h1">{lesson.title}</h1>
          {author}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </header>

      <section aria-label="Содержание урока" className="flex flex-col gap-4">
        {lesson.content.blocks.map((block) => (
          <BlockView key={block.id} block={block} />
        ))}
      </section>
    </div>
  );
}

/** «Сохранить себе», or — once saved — where the copy is. */
function SaveShared({ target }: { target: ShareTarget }) {
  const router = useRouter();
  const copy = useStore((s) => (target.kind === "textbook" ? textbookFromShare(s.data, target.id) : lessonFromShare(s.data, target.id)));
  const saveTextbook = useStore((s) => s.saveSharedTextbook);
  const saveLesson = useStore((s) => s.saveSharedLesson);
  const href = (id: string) => `/${target.kind}/${id}`;

  if (copy) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <InLibraryChip />
        <Link href={href(copy.id)} className={buttonClass("secondary")}>
          Открыть в библиотеке
        </Link>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      icon={<BookmarkPlus size={20} strokeWidth={1.75} aria-hidden />}
      onClick={() => {
        const copyId = target.kind === "textbook" ? saveTextbook(target.id) : saveLesson(target.id);
        if (copyId) toast("Сохранено в библиотеку", { label: "Открыть", onClick: () => router.push(href(copyId)) });
      }}
    >
      Сохранить себе
    </Button>
  );
}

function Missing({ kind }: { kind: "textbook" | "lesson" }) {
  return (
    <EmptyState
      icon={kind === "textbook" ? <BookX size={28} strokeWidth={1.5} aria-hidden /> : <FileX size={28} strokeWidth={1.5} aria-hidden />}
      title={kind === "textbook" ? "Учебник не найден" : "Урок не найден"}
      description="Возможно, автор его удалил."
    />
  );
}
