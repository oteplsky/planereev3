"use client";

import { useState } from "react";
import { BookOpen, FileText, Plus, SearchX } from "lucide-react";
import { LessonStatusBadge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Menu } from "@/components/ui/Menu";
import { SearchField } from "@/components/ui/SearchField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { toast } from "@/components/ui/Toast";
import { AddTile, FolderCard, MaterialCard } from "./Cards";
import { LibraryDialogs, requestDelete, type DialogState } from "./LibraryDialogs";
import { contextHref } from "@/lib/context";
import { folderItemCount, folderPath, lessonStatusForLearner, libraryLocation, textbookLessons } from "@/lib/domain";
import { count, LESSONS, MATERIALS, TEXTBOOKS } from "@/lib/format";
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
 * Search and filters apply to the current location (spec §5.6).
 */
export function Library({ learner, folderId }: LibraryProps) {
  const data = useStore((s) => s.data);
  const duplicateMaterial = useStore((s) => s.duplicateMaterial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dialog, setDialog] = useState<DialogState>(null);

  const editable = learner === null;
  const learnerId = learner?.id ?? null;
  // A deleted or unknown folder falls back to the root.
  const folder = data.folders.find((f) => f.id === folderId) ?? null;
  const path = folderPath(data, folder?.id ?? null);

  const location = libraryLocation(data, folder?.id ?? null);
  const q = query.trim().toLocaleLowerCase("ru");
  const matches = (title: string) => !q || title.toLocaleLowerCase("ru").includes(q);

  const folders = filter === "all" ? location.folders.filter((f) => matches(f.name)) : [];
  const textbooks = filter === "lessons" ? [] : location.textbooks.filter((t) => matches(t.title));
  const lessons = filter === "textbooks" ? [] : location.lessons.filter((l) => matches(l.title));
  const isFiltering = q !== "" || filter !== "all";
  const nothingFound = isFiltering && folders.length + textbooks.length + lessons.length === 0;
  const locationEmpty =
    location.folders.length + location.textbooks.length + location.lessons.length === 0;

  const materialsSummary = [
    textbooks.length ? count(textbooks.length, TEXTBOOKS) : null,
    lessons.length ? count(lessons.length, LESSONS) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const duplicate = (kind: "lesson" | "textbook", id: string) => {
    duplicateMaterial(kind, id);
    toast(kind === "lesson" ? "Копия урока создана" : "Копия учебника создана");
  };

  return (
    <section aria-labelledby="library-heading" className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        {learner && (
          <div>
            <h2 id="library-heading" className="text-h2">
              Библиотека
            </h2>
            <p className="mt-1 text-body text-ink-secondary">
              Уроки открываются в версии для ученика. Общие материалы меняются в разделе «Библиотека».
            </p>
          </div>
        )}
        {!learner && (
          <h2 id="library-heading" className="sr-only">
            Материалы библиотеки
          </h2>
        )}

        {path.length > 0 && (
          <Breadcrumbs
            items={[
              { label: "Библиотека", href: contextHref("/library", learnerId) },
              ...path.slice(0, -1).map((f) => ({ label: f.name, href: contextHref("/library", learnerId, { folder: f.id }) })),
            ]}
            current={path.at(-1)!.name}
          />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={folder ? `Поиск в «${folder.name}»` : "Поиск по названию"}
            className="min-w-60 flex-1"
          />
          <SegmentedControl label="Тип материала" options={filterOptions} value={filter} onChange={setFilter} />
          {editable && (
            <Menu
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
              trigger={(props) => (
                <Button {...props} variant="primary" icon={<Plus size={20} strokeWidth={1.75} aria-hidden />}>
                  Создать
                </Button>
              )}
            />
          )}
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
          {(folders.length > 0 || (editable && !isFiltering)) && (
            <div>
              <SectionLabel label="Папки" count={folders.length} />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
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
                {editable && !isFiltering && (
                  <AddTile label="Добавить папку" onClick={() => setDialog({ type: "create", kind: "folder" })} />
                )}
              </div>
            </div>
          )}

          {textbooks.length + lessons.length > 0 && (
            <div>
              <SectionLabel label="Материалы" summary={materialsSummary} />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
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
                      caption={`Учебник · ${count(lessonCount, LESSONS)}`}
                      cover={t.cover}
                      actions={
                        editable
                          ? {
                              onRename: () => setDialog({ type: "rename", target }),
                              onDuplicate: () => duplicate("textbook", t.id),
                              onMove: () => setDialog({ type: "move", target }),
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
                      caption="Урок"
                      cover={l.cover}
                      badge={learnerId && <LessonStatusBadge status={lessonStatusForLearner(data, learnerId, l.id)} />}
                      actions={
                        editable
                          ? {
                              onRename: () => setDialog({ type: "rename", target }),
                              onDuplicate: () => duplicate("lesson", l.id),
                              onMove: () => setDialog({ type: "move", target }),
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

          {locationEmpty && (
            <EmptyState
              icon={<Plus size={28} strokeWidth={1.5} aria-hidden />}
              title={folder ? "В папке пока пусто" : "Библиотека пока пустая"}
              description={
                editable
                  ? "Создайте учебник или урок — или перенесите сюда готовые материалы."
                  : "Материалы добавляются в разделе «Библиотека»."
              }
            />
          )}
        </>
      )}

      {editable && <LibraryDialogs state={dialog} onClose={() => setDialog(null)} folderId={folder?.id ?? null} />}
    </section>
  );
}

export function SectionLabel({ label, count, summary }: { label: string; count?: number; summary?: string }) {
  return (
    <h3 className="mb-3 flex items-baseline gap-3">
      <span className="text-caption font-bold tracking-wider text-ink-secondary uppercase">{label}</span>
      {count !== undefined && <span className="text-caption text-neutral-400">{count}</span>}
      {summary && <span className="text-caption text-neutral-400">{summary}</span>}
    </h3>
  );
}
