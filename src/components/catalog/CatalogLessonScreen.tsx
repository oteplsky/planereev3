"use client";

import { useParams, useRouter } from "next/navigation";
import { FileX } from "lucide-react";
import { BlockView } from "@/components/lesson/LessonBlocks";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { catalog } from "@/lib/catalog";
import { catalogHref, useReturnLearner } from "@/lib/context";
import { AddToLibrary } from "./AddToLibrary";
import { catalogCrumbs } from "./CatalogTextbookScreen";

/** Read-only preview of one catalog lesson. Adding always takes the whole textbook. */
export function CatalogLessonScreen() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const router = useRouter();
  const from = useReturnLearner();
  const fromId = from?.id ?? null;
  const textbook = catalog.textbooks.find((t) => t.id === id);
  const lesson = catalog.lessons.find((l) => l.id === lessonId && l.textbookId === id);

  if (!textbook || !lesson) {
    return (
      <EmptyState
        icon={<FileX size={28} strokeWidth={1.5} aria-hidden />}
        title="Урок не найден"
        description="Возможно, его убрали из готовых материалов."
        action={<Button onClick={() => router.push(catalogHref("/catalog", fromId))}>К готовым материалам</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        <Breadcrumbs
          items={[...catalogCrumbs(from), { label: textbook.title, href: catalogHref(`/catalog/${textbook.id}`, fromId) }]}
          current={lesson.title}
        />
        <h1 className="text-h1">{lesson.title}</h1>
        <div>
          <AddToLibrary catalogTextbookId={textbook.id} from={from} />
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
