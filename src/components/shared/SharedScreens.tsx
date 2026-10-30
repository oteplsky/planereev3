"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookmarkPlus, BookX, FileX, FolderX, Link2Off } from "lucide-react";
import { InLibraryChip } from "@/components/catalog/AddToLibrary";
import { BlockView } from "@/components/lesson/LessonBlocks";
import { TextbookPreview } from "@/components/textbook/TextbookPreview";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button, buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { MATERIAL_GRID, MaterialCard } from "@/components/library/Cards";
import {
  findShareLink,
  folderPath,
  ownShareSave,
  shareLinkUsedUp,
  folderTree,
  libraryLocation,
  shareStatus,
  sharedAuthor,
  sharedLessonAuthor,
  textbookLessonCount,
} from "@/lib/domain";
import { contextHref } from "@/lib/context";
import { useStore } from "@/lib/store";
import { saveLinkHref, sharedTextbookLessonHref, viewHref } from "@/lib/share";
import type { AppData, Lesson, ShareLink } from "@/lib/types";
import { AuthorLine } from "@/components/library/AuthorLine";
import type { Crumb } from "@/components/ui/Breadcrumbs";

/** A textbook opened from a «Только просмотр» link. */
export function SharedTextbookScreen() {
  const { id } = useParams<{ id: string }>();
  return <TextbookShare id={id} base={viewHref({ kind: "textbook", id })} />;
}

/** One lesson of a textbook opened from a «Только просмотр» link. */
export function SharedLessonScreen() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  return <TextbookLessonShare id={id} lessonId={lessonId} base={viewHref({ kind: "textbook", id })} />;
}

/** One lesson shared on its own with a «Только просмотр» link, wherever it sits in the sender's library. */
export function SharedStandaloneLessonScreen() {
  const { id } = useParams<{ id: string }>();
  return <LessonShare id={id} />;
}

/** A folder opened from a «Только просмотр» link. */
export function SharedFolderScreen() {
  const { id } = useParams<{ id: string }>();
  return <FolderShare id={id} />;
}

/** A one-time «С сохранением» link: the material with «Сохранить себе», until someone else has used it. */
export function SaveLinkScreen() {
  const { token } = useParams<{ token: string }>();
  return (
    <SaveLinkGate token={token}>
      {(link) =>
        link.kind === "textbook" ? (
          <TextbookShare id={link.materialId} base={saveLinkHref(link.token)} action={<SaveFromLink link={link} />} />
        ) : link.kind === "folder" ? (
          <FolderShare id={link.materialId} action={<SaveFromLink link={link} />} />
        ) : (
          <LessonShare id={link.materialId} action={<SaveFromLink link={link} />} />
        )
      }
    </SaveLinkGate>
  );
}

/** One lesson of a textbook opened from a one-time link. Saving takes the whole textbook. */
export function SaveLinkLessonScreen() {
  const { token, lessonId } = useParams<{ token: string; lessonId: string }>();
  return (
    <SaveLinkGate token={token}>
      {(link) =>
        link.kind === "textbook" ? (
          <TextbookLessonShare
            id={link.materialId}
            lessonId={lessonId}
            base={saveLinkHref(link.token)}
            action={<SaveFromLink link={link} />}
          />
        ) : (
          <Missing kind="lesson" />
        )
      }
    </SaveLinkGate>
  );
}

/** A used-up link shows nothing of the material, except to those who saved through it. */
function SaveLinkGate({ token, children }: { token: string; children: (link: ShareLink) => ReactNode }) {
  const data = useStore((s) => s.data);
  const link = findShareLink(data, token);
  if (!link) return <EmptyState icon={<Link2Off size={28} strokeWidth={1.5} aria-hidden />} title="Ссылка не найдена" />;
  if (shareLinkUsedUp(link) && !ownShareSave(data, link)) {
    return <EmptyState icon={<Link2Off size={28} strokeWidth={1.5} aria-hidden />} title="Ссылка уже использована" />;
  }
  return children(link);
}

// Only own material is shared, even if a link is typed in by hand.
const isShared = (data: AppData, kind: ShareLink["kind"], id: string) => shareStatus(data, kind, id) === "own";

function TextbookShare({ id, base, action }: { id: string; base: string; action?: ReactNode }) {
  const data = useStore((s) => s.data);
  const textbook = data.textbooks.find((t) => t.id === id);
  if (!textbook || !isShared(data, "textbook", id)) return <Missing kind="textbook" />;

  return (
    <TextbookPreview
      materials={data}
      textbook={textbook}
      author={sharedAuthor(data, textbook)}
      action={action}
      lessonHref={(lesson) => sharedTextbookLessonHref(base, lesson.id)}
    />
  );
}

function TextbookLessonShare({ id, lessonId, base, action }: { id: string; lessonId: string; base: string; action?: ReactNode }) {
  const data = useStore((s) => s.data);
  const textbook = data.textbooks.find((t) => t.id === id);
  const lesson = data.lessons.find((l) => l.id === lessonId && l.textbookId === id);
  if (!textbook || !lesson || !isShared(data, "textbook", id)) return <Missing kind="lesson" />;

  return <LessonPreview lesson={lesson} crumbs={[{ label: textbook.title, href: base }]} action={action} />;
}

function LessonShare({ id, action }: { id: string; action?: ReactNode }) {
  const data = useStore((s) => s.data);
  const lesson = data.lessons.find((l) => l.id === id);
  if (!lesson || !isShared(data, "lesson", id)) return <Missing kind="lesson" />;

  return <LessonPreview lesson={lesson} author={<AuthorLine author={sharedLessonAuthor(data, lesson)} />} action={action} />;
}

/**
 * A shared folder on one page: its own materials first, then each subfolder's under its path.
 * Materials open their view pages; saving takes the whole folder.
 */
function FolderShare({ id, action }: { id: string; action?: ReactNode }) {
  const data = useStore((s) => s.data);
  const tree = folderTree(data, id);
  if (tree.length === 0 || !isShared(data, "folder", id)) return <Missing kind="folder" />;
  const depth = folderPath(data, id).length - 1;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col items-start gap-2">
        <h1 className="text-h1">{tree[0].name}</h1>
        <AuthorLine author={{ id: data.teacher.id, name: data.teacher.name }} />
        {action && <div className="mt-3">{action}</div>}
      </header>

      {tree.map((folder) => {
        const { materials } = libraryLocation(data, folder.id);
        if (materials.length === 0) return null;
        const path = folderPath(data, folder.id).slice(depth + 1).map((f) => f.name);
        return (
          <section key={folder.id} aria-label={path.join(" / ") || tree[0].name} className="flex flex-col gap-3">
            {path.length > 0 && <h2 className="text-h3">{path.join(" / ")}</h2>}
            <div className={MATERIAL_GRID}>
              {materials.map(({ kind, item }) =>
                kind === "textbook" ? (
                  <MaterialCard
                    key={item.id}
                    href={viewHref({ kind, id: item.id })}
                    kind={kind}
                    title={item.title}
                    lessonCount={textbookLessonCount(item)}
                    cover={item.cover}
                    coverImage={item.coverImage}
                  />
                ) : (
                  <MaterialCard key={item.id} href={viewHref({ kind, id: item.id })} kind={kind} title={item.title} cover={item.cover} />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
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

/** «Сохранить себе», or — once saved through this link — where the copy is. */
function SaveFromLink({ link }: { link: ShareLink }) {
  const router = useRouter();
  const data = useStore((s) => s.data);
  const saved = ownShareSave(data, link);
  const copyId = saved?.copyId;
  const copyExists =
    link.kind === "textbook"
      ? data.textbooks.some((t) => t.id === copyId)
      : link.kind === "folder"
        ? data.folders.some((f) => f.id === copyId)
        : data.lessons.some((l) => l.id === copyId);
  const save = useStore((s) => s.saveFromShareLink);
  const href = (id: string) => (link.kind === "folder" ? contextHref("/library", null, { folder: id }) : `/${link.kind}/${id}`);

  if (saved) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <InLibraryChip />
        {copyExists && (
          <Link href={href(copyId!)} className={buttonClass("secondary")}>
            Открыть в библиотеке
          </Link>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      icon={<BookmarkPlus size={20} strokeWidth={1.75} aria-hidden />}
      onClick={() => {
        const newCopyId = save(link.token);
        if (newCopyId) toast("Сохранено в библиотеку", { label: "Открыть", onClick: () => router.push(href(newCopyId)) });
      }}
    >
      Сохранить себе
    </Button>
  );
}

const missing = {
  textbook: { icon: BookX, title: "Учебник не найден", description: "Возможно, автор его удалил." },
  lesson: { icon: FileX, title: "Урок не найден", description: "Возможно, автор его удалил." },
  folder: { icon: FolderX, title: "Папка не найдена", description: "Возможно, автор её удалил." },
};

function Missing({ kind }: { kind: ShareLink["kind"] }) {
  const { icon: Icon, title, description } = missing[kind];
  return <EmptyState icon={<Icon size={28} strokeWidth={1.5} aria-hidden />} title={title} description={description} />;
}
