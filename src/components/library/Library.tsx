"use client";

import { useState } from "react";
import { BookOpen, FileText, FolderOpen, FolderOutput, SearchX } from "lucide-react";
import { LessonStatusChips, UsedChip } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { SearchField } from "@/components/ui/SearchField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { toast } from "@/components/ui/Toast";
import { AddTile, FolderCard, MaterialCard } from "./Cards";
import { LibraryDialogs, requestDelete, type DialogState } from "./LibraryDialogs";
import { contextHref } from "@/lib/context";
import {
  folderItemCount,
  folderPath,
  homeworkStatusForLearner,
  lessonStatusForLearner,
  libraryLocation,
  searchMaterials,
  textbookLessons,
  textbookUsedByLearner,
} from "@/lib/domain";
import { count, MATERIALS } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Learner } from "@/lib/types";

type Filter = "all" | "textbooks" | "lessons";

const filterOptions: { value: Filter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "textbooks", label: "Учебники" },
  { value: "lessons", label: "Уроки" },
];

interface LibraryProps {
  /** Null = global context. In a learner context the library is read-only (spec §11.4). */
  learner: Learner | null;
  folderId: string | null;
}

/**
 * The one library implementation, shared by the global and learner contexts (spec §7.1).
 * Two levels only: the root and one open folder. Search covers the whole library and shows
 * a flat list without folders; the type filter alone applies to the current location.
 */
export function Library({ learner, folderId }: LibraryProps) {
  const data = useStore((s) => s.data);
  const duplicateMaterial = useStore((s) => s.duplicateMaterial);
  const moveMaterial = useStore((s) => s.moveMaterial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dialog, setDialog] = useState<DialogState>(null);

  const editable = learner === null;
  const learnerId = learner?.id ?? null;
  // A deleted or unknown folder falls back to the root.
  const folder = data.folders.find((f) => f.id === folderId) ?? null;
  const path = folderPath(data, folder?.id ?? null);

  const location = libraryLocation(data, folder?.id ?? null);
  const searching = query.trim() !== "";
  const source = searching ? searchMaterials(data, query) : location;

  // Folders live only at the root and never appear in search results.
  const folders = !searching && !folder && filter === "all" ? location.folders : [];
  const textbooks = filter === "lessons" ? [] : source.textbooks;
  const lessons = filter === "textbooks" ? [] : source.lessons;
  const isFiltering = searching || filter !== "all";
  const nothingFound = isFiltering && folders.length + textbooks.length + lessons.length === 0;
  const locationEmpty =
    location.folders.length + location.textbooks.length + location.lessons.length === 0;

  /** «Убрать из папки»: the material stays in the library and goes back to the root. */
  const removeFromFolder = (kind: "lesson" | "textbook", item: { id: string; folderId: string | null }): MenuItem[] =>
    item.folderId
      ? [
          {
            label: "Убрать из папки",
            icon: <FolderOutput size={18} strokeWidth={1.75} aria-hidden />,
            onSelect: () => {
              moveMaterial(kind, item.id, null);
              toast("Перенесено в «Библиотеку»");
            },
          },
        ]
      : [];

  const duplicate = (kind: "lesson" | "textbook", id: string) => {
    duplicateMaterial(kind, id);
    toast(kind === "lesson" ? "Копия урока создана" : "Копия учебника создана");
  };

  return (
    <section aria-labelledby="library-heading" className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        {path.length > 0 && (
          <Breadcrumbs
            items={[
              { label: "Библиотека", href: contextHref("/library", learnerId) },
              ...path.slice(0, -1).map((f) => ({ label: f.name, href: contextHref("/library", learnerId, { folder: f.id }) })),
            ]}
            current={path.at(-1)!.name}
          />
        )}

        {/* Inside a folder its name is the title: nothing else on screen says where you are. */}
        <h2 id="library-heading" className={folder ? (learner ? "text-h2" : "text-h1") : learner ? "text-h2" : "sr-only"}>
          {folder ? folder.name : "Библиотека"}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Поиск по названию"
            className="min-w-60 flex-1"
          />
          <SegmentedControl label="Тип материала" options={filterOptions} value={filter} onChange={setFilter} />
        </div>
      </div>

      {nothingFound ? (
        <EmptyState
          icon={<SearchX size={28} strokeWidth={1.5} aria-hidden />}
          title="Ничего не нашли"
          description="Попробуйте другое название или сбросьте фильтр."
          action={
            <Button
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Сбросить
            </Button>
          }
        />
      ) : (
        <>
          {(folders.length > 0 || (editable && !isFiltering && !folder)) && (
            <div>
              <SectionLabel label="Папки" />
              <div className={GRID}>
                {editable && !isFiltering && !folder && (
                  <AddTile label="Добавить папку" onClick={() => setDialog({ type: "create", kind: "folder" })} />
                )}
                {folders.map((f) => (
                  <FolderCard
                    key={f.id}
                    href={contextHref("/library", learnerId, { folder: f.id })}
                    name={f.name}
                    caption={count(folderItemCount(data, f.id), MATERIALS)}
                    actions={
                      editable
                        ? {
                            onRename: () => setDialog({ type: "rename", target: { kind: "folder", id: f.id, title: f.name } }),
                            onDelete: () => setDialog(requestDelete(data, { kind: "folder", id: f.id, title: f.name })),
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {(textbooks.length + lessons.length > 0 || (editable && !isFiltering)) && (
            <div>
              <SectionLabel label={searching ? "Результаты поиска" : "Материалы"} />
              <div className={GRID}>
                {editable && !isFiltering && (
                  <Menu
                    align="left"
                    items={[
                      {
                        label: "Учебник",
                        icon: <BookOpen size={18} strokeWidth={1.75} aria-hidden />,
                        onSelect: () => setDialog({ type: "create", kind: "textbook" }),
                      },
                      {
                        label: "Урок",
                        icon: <FileText size={18} strokeWidth={1.75} aria-hidden />,
                        onSelect: () => setDialog({ type: "create", kind: "lesson" }),
                      },
                    ]}
                    trigger={(props) => <AddTile {...props} label="Добавить материал" className="mt-4 h-[calc(100%-1rem)] w-full" />}
                  />
                )}
                {textbooks.map((t) => {
                  const { sections, loose } = textbookLessons(data, t);
                  const lessonCount = loose.length + sections.reduce((n, s) => n + s.lessons.length, 0);
                  const target = { kind: "textbook" as const, id: t.id, title: t.title };
                  return (
                    <MaterialCard
                      key={t.id}
                      href={contextHref(`/textbook/${t.id}`, learnerId)}
                      kind="textbook"
                      title={t.title}
                      lessonCount={lessonCount}
                      badge={learnerId && textbookUsedByLearner(data, learnerId, t) && <UsedChip />}
                      cover={t.cover}
                      actions={
                        editable
                          ? {
                              onRename: () => setDialog({ type: "rename", target }),
                              onDuplicate: () => duplicate("textbook", t.id),
                              onMove: () => setDialog({ type: "move", target }),
                              extra: removeFromFolder("textbook", t),
                              onDelete: () => setDialog(requestDelete(data, target)),
                            }
                          : undefined
                      }
                    />
                  );
                })}
                {lessons.map((l) => {
                  const target = { kind: "lesson" as const, id: l.id, title: l.title };
                  return (
                    <MaterialCard
                      key={l.id}
                      href={contextHref(`/lesson/${l.id}`, learnerId)}
                      kind="lesson"
                      title={l.title}
                      cover={l.cover}
                      badge={
                        learnerId && (
                          <LessonStatusChips
                            lesson={lessonStatusForLearner(data, learnerId, l.id)}
                            homework={homeworkStatusForLearner(data, learnerId, l.id)}
                          />
                        )
                      }
                      actions={
                        editable
                          ? {
                              onRename: () => setDialog({ type: "rename", target }),
                              onDuplicate: () => duplicate("lesson", l.id),
                              onMove: () => setDialog({ type: "move", target }),
                              extra: removeFromFolder("lesson", l),
                              onDelete: () => setDialog(requestDelete(data, target)),
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          )}

          {locationEmpty && !editable && (
            <EmptyState icon={<FolderOpen size={28} strokeWidth={1.5} aria-hidden />} title={folder ? "В папке пусто" : "Библиотека пустая"} />
          )}
        </>
      )}

      {editable && <LibraryDialogs state={dialog} onClose={() => setDialog(null)} folderId={folder?.id ?? null} />}
    </section>
  );
}

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4";

export function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <h3 className="mb-3 flex items-baseline gap-3">
      <span className="text-caption font-bold tracking-wider text-ink-secondary uppercase">{label}</span>
      {count !== undefined && <span className="text-caption text-ink-secondary">{count}</span>}
    </h3>
  );
}
