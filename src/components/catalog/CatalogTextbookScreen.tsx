"use client";

import { useParams, useRouter } from "next/navigation";
import { BookX } from "lucide-react";
import { TextbookPreview } from "@/components/textbook/TextbookPreview";
import { type Crumb } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { catalog } from "@/lib/catalog";
import { catalogHref, contextHref, useReturnLearner } from "@/lib/context";
import type { Learner } from "@/lib/types";
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

  return (
    <TextbookPreview
      materials={catalog}
      textbook={textbook}
      author={textbook.author}
      crumbs={catalogCrumbs(from)}
      action={<AddToLibrary catalogTextbookId={textbook.id} from={from} />}
      lessonHref={(lesson) => catalogHref(`/catalog/${textbook.id}/lesson/${lesson.id}`, fromId)}
    />
  );
}
