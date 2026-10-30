"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type DragEvent } from "react";
import { ArrowRight, BookOpen, FileText, FolderOpen, FolderOutput, SearchX } from "lucide-react";
import { InLibraryChip } from "@/components/catalog/AddToLibrary";
import { LessonStatusText } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button, textButtonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Progress } from "@/components/ui/Progress";
import { SearchField } from "@/components/ui/SearchField";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { toast } from "@/components/ui/Toast";
import { Checkbox } from "@/components/ui/Checkbox";
import { AddFolderTile, AddTile, FolderCard, MATERIAL_GRID, MaterialCard, type ReorderHandlers } from "./Cards";
import { LibraryDialogs, requestDelete, type DialogState } from "./LibraryDialogs";
import { FiltersButton, MetaFilterBar, metaFilterCount, useMetaFilters } from "./MetaFilterBar";
import { catalog } from "@/lib/catalog";
import { catalogHref, contextHref } from "@/lib/context";
import {
  folderItemCount,
  folderPath,
  homeworkStatusForLearner,
  lessonStatusForLearner,
  libraryAuthors,
  libraryLocation,
  searchMaterials,
  sortByRecentUse,
  textbookFromCatalog,
  textbookLessonCount,
  textbookProgress,
  type LibraryItem,
  type SourceFilter,
  lessonTitleFor,
} from "@/lib/domain";
import { hasActiveFilters, type MetaFilters } from "@/lib/meta";
import { shareAction } from "./ShareDialog";
import { count, TEXTBOOKS } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Learner } from "@/lib/types";

type Filter = "all" | "textbooks" | "lessons";

/**
 * What «Добавить материал» can create. With one kind the tile opens its form directly;
 * with more it becomes a menu («Урок», «Учебник»).
 */
const addableKinds: ("textbook" | "lesson")[] = ["lesson", "textbook"];
const kindOption = {
  textbook: { label: "Учебник", icon: BookOpen },
  lesson: { label: "Урок", icon: FileText },
};

/** The catalog lives in the materials, next to the teacher's own. */
type Source = "own" | "catalog";
const sourceOptions: { value: Source; label: string }[] = [
  { value: "own", label: "Мои материалы" },
  { value: "catalog", label: "Готовые материалы" },
];


interface LibraryProps {
  /** Null = global context. In a learner context the library is read-only (spec §11.4). */
  learner: Learner | null;
  folderId: string | null;
}

/**
 * The one library implementation, shared by the global and learner contexts (spec §7.1).
 * Two levels only: the root and one open folder. Search and the metadata filters cover the whole
 * library and show a flat list without folders; the type filter alone applies to the current location.
 */
export function Library({ learner, folderId }: LibraryProps) {
  const data = useStore((s) => s.data);
  const duplicateMaterial = useStore((s) => s.duplicateMaterial);
  const moveMaterial = useStore((s) => s.moveMaterial);
  const reorderMaterials = useStore((s) => s.reorderMaterials);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const { meta, setMetaFilter, resetMeta, levelOptions } = useMetaFilters(data);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  /** While dragging: the dragged card and the order it would land in. */
  const [drag, setDrag] = useState<{ id: string; order: LibraryItem[] } | null>(null);
  const params = useSearchParams();

  const editable = learner === null;
  const learnerId = learner?.id ?? null;
  // A deleted or unknown folder falls back to the root.
  const folder = data.folders.find((f) => f.id === folderId) ?? null;
  const path = folderPath(data, folder?.id ?? null);

  // At the root only: a folder holds the teacher's own materials.
  const sourceSwitch = !folder;
  const source: Source = sourceSwitch && params.get("materials") === "catalog" ? "catalog" : "own";
  const setSource = (next: Source) =>
    router.replace(contextHref("/library", learnerId, { materials: next === "catalog" ? next : null }), { scroll: false });
  const sourceControl = sourceSwitch && (
    <div className="mb-4 flex">
      <SegmentedControl label="Материалы" options={sourceOptions} value={source} onChange={setSource} />
    </div>
  );

  const location = libraryLocation(data, folder?.id ?? null);
  const authors = libraryAuthors(data);
  const metaFiltering = hasActiveFilters(meta) || sourceFilter !== null;
  const searching = query.trim() !== "" || metaFiltering;
  const results = searching ? searchMaterials(data, query, meta, sourceFilter) : location;
  const resetFilters = () => {
    resetMeta();
    setSourceFilter(null);
    setFilter("all");
  };

  // Folders live only at the root. They stay put above the search, like a navigation, while it filters the materials.
  const folders = folder ? [] : location.folders;
  const textbooks = filter === "lessons" ? [] : learnerId ? sortByRecentUse(data, learnerId, results.textbooks) : results.textbooks;
  const lessons = filter === "textbooks" ? [] : results.lessons;
  const isFiltering = searching || filter !== "all";
  // The teacher's own order, in which materials can be dragged. Search and the learner context list textbooks first.
  const reorderable = editable && !isFiltering;
  const materials: LibraryItem[] = reorderable
    ? (drag?.order ?? location.materials)
    : [
        ...textbooks.map((item) => ({ kind: "textbook" as const, item })),
        ...lessons.map((item) => ({ kind: "lesson" as const, item })),
      ];
  const nothingFound = isFiltering && textbooks.length + lessons.length === 0;
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

  const dragHandlers = (key: string): ReorderHandlers => ({
    dragging: drag?.id === key,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", key);
      // Changing the DOM inside dragstart can cancel the drag in Chromium.
      requestAnimationFrame(() => setDrag({ id: key, order: location.materials }));
    },
    onDragEnd: () => setDrag(null),
    // The dragged card takes the hovered card's place, so the grid shows where it will land.
    onDragOver: (e: DragEvent) => {
      if (!drag) return;
      e.preventDefault();
      if (key === drag.id) return;
      const order = drag.order.filter((m) => m.item.id !== drag.id);
      const to = drag.order.findIndex((m) => m.item.id === key);
      order.splice(to, 0, drag.order.find((m) => m.item.id === drag.id)!);
      setDrag({ ...drag, order });
    },
  });

  /** The whole grid takes the drop, gaps between cards included. */
  const gridDrop = drag && {
    onDragOver: (e: DragEvent) => e.preventDefault(),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      reorderMaterials(drag.order.map((m) => ({ kind: m.kind, id: m.item.id })));
      setDrag(null);
    },
  };

  const renderMaterial = ({ kind, item }: LibraryItem) => {
    const target = { kind, id: item.id, title: item.title };
    const actions = editable
      ? {
          onRename: () => setDialog({ type: "rename", target }),
          ...shareAction(data, kind, item.id, () => setDialog({ type: "share", target })),
          onDuplicate: () => duplicate(kind, item.id),
          onMove: () => setDialog({ type: "move", target }),
          extra: [
            ...(kind === "lesson"
              ? [
                  {
                    label: "Переместить в учебник",
                    icon: <BookOpen size={18} strokeWidth={1.75} aria-hidden />,
                    onSelect: () => setDialog({ type: "moveToTextbook", target: { ...target, kind } }),
                  },
                ]
              : []),
            ...removeFromFolder(kind, item),
          ],
          onDelete: () => setDialog(requestDelete(data, target)),
        }
      : undefined;
    const reorder = reorderable ? dragHandlers(item.id) : undefined;
    if (kind === "textbook") {
      const progress = learnerId ? textbookProgress(data, learnerId, item) : null;
      return (
        <MaterialCard
          key={item.id}
          href={contextHref(`/textbook/${item.id}`, learnerId)}
          kind="textbook"
          title={item.title}
          caption={item.author?.name}
          lessonCount={textbookLessonCount(item)}
          badge={progress && <Progress value={progress.completed} total={progress.total} />}
          cover={item.cover}
          coverImage={item.coverImage}
          actions={actions}
          reorder={reorder}
        />
      );
    }
    return (
      <MaterialCard
        key={item.id}
        href={contextHref(`/lesson/${item.id}`, learnerId)}
        kind="lesson"
        title={lessonTitleFor(data, item, learnerId)}
        caption={item.author?.name}
        cover={item.cover}
        badge={
          learnerId && (
            <LessonStatusText
              lesson={lessonStatusForLearner(data, learnerId, item.id)}
              homework={homeworkStatusForLearner(data, learnerId, item.id)}
            />
          )
        }
        actions={actions}
        reorder={reorder}
      />
    );
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
        <h2 id="library-heading" className={folder ? (learner ? "text-h2" : "text-h1") : "sr-only"}>
          {folder ? folder.name : "Библиотека"}
        </h2>

        {(folders.length > 0 || (editable && !folder)) && (
          <div className={FOLDER_GRID}>
            {editable && !folder && <AddFolderTile onClick={() => setDialog({ type: "create", kind: "folder" })} />}
            {folders.map((f) => (
              <FolderCard
                key={f.id}
                href={contextHref("/library", learnerId, { folder: f.id })}
                name={f.name}
                itemCount={folderItemCount(data, f.id)}
                actions={
                  editable
                    ? {
                        onRename: () => setDialog({ type: "rename", target: { kind: "folder", id: f.id, title: f.name } }),
                        ...shareAction(data, "folder", f.id, () =>
                          setDialog({ type: "share", target: { kind: "folder", id: f.id, title: f.name } }),
                        ),
                        onDelete: () => setDialog(requestDelete(data, { kind: "folder", id: f.id, title: f.name })),
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Поиск по названию"
            className="min-w-60 flex-1"
          />
          <FiltersButton
            open={filtersOpen}
            count={metaFilterCount(meta) + (sourceFilter !== null ? 1 : 0) + (filter !== "all" ? 1 : 0)}
            onClick={() => setFiltersOpen((o) => !o)}
          />
        </div>

        {filtersOpen && (
          <MetaFilterBar
            meta={meta}
            levelOptions={levelOptions}
            onChange={setMetaFilter}
            active={metaFiltering || filter !== "all"}
            onReset={resetFilters}
            leading={<TypeFilter value={filter} onChange={setFilter} />}
          >
            {/* Only once the library has materials by someone else: with one source there is nothing to pick. */}
            {authors.length > 0 && (
              <Select
                aria-label="Источник"
                placeholder="Источник"
                value={sourceFilter}
                options={[{ value: "mine", label: "Мои материалы" }, ...authors.map((a) => ({ value: a.id, label: a.name }))]}
                onChange={setSourceFilter}
                highlighted={sourceFilter !== null}
                className="w-full sm:w-48"
              />
            )}
          </MetaFilterBar>
        )}
      </div>

      {nothingFound && source === "own" ? (
        <div>
          {sourceControl}
          <EmptyState
            icon={<SearchX size={28} strokeWidth={1.5} aria-hidden />}
            title="Ничего не нашли"
            description="Попробуйте другое название или сбросьте фильтр."
            action={
              <Button
                onClick={() => {
                  setQuery("");
                  resetFilters();
                }}
              >
                Сбросить
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {source === "catalog" ? (
            <div>
              {sourceControl}
              <CatalogMaterials query={query} meta={meta} filter={filter} learnerId={learnerId} />
            </div>
          ) : (textbooks.length + lessons.length > 0 || (editable && !isFiltering) || sourceSwitch) && (
            <div>
              {sourceControl || (searching && <SectionLabel label="Результаты поиска" />)}
              <div className={MATERIAL_GRID} {...gridDrop}>
                {editable && !isFiltering && <AddMaterial onSelect={(kind) => setDialog({ type: "create", kind })} />}
                {materials.map(renderMaterial)}
              </div>
            </div>
          )}

          {locationEmpty && !editable && source === "own" && (
            <EmptyState icon={<FolderOpen size={28} strokeWidth={1.5} aria-hidden />} title={folder ? "В папке пусто" : "Библиотека пустая"} />
          )}
        </>
      )}

      {searching && sourceFilter !== "mine" && source === "own" && (
        <CatalogHint query={query} meta={meta} learnerId={learnerId} onOpen={sourceSwitch ? () => setSource("catalog") : undefined} />
      )}

      {editable && (
        <LibraryDialogs
          state={dialog}
          onClose={() => setDialog(null)}
          folderId={folder?.id ?? null}
          // A new textbook opens straight away, ready to edit.
          onTextbookCreated={(id) => router.push(`/textbook/${id}`)}
        />
      )}
    </section>
  );
}

/**
 * While searching, Planeree's textbooks that match and aren't in the library yet: the moment a teacher
 * looks for something they don't have. Opens the catalog with the same search.
 */
function CatalogHint({ query, meta, learnerId, onOpen }: { query: string; meta: MetaFilters; learnerId: string | null; onOpen?: () => void }) {
  const data = useStore((s) => s.data);
  const found = searchMaterials(catalog, query, meta).textbooks.filter((t) => !textbookFromCatalog(data, t.id));
  if (found.length === 0) return null;
  const label = (
    <>
      В готовых материалах: {count(found.length, TEXTBOOKS)}
      <ArrowRight size={18} strokeWidth={1.75} aria-hidden />
    </>
  );
  // The catalog is the other half of the materials switch, with the same search.
  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={`${textButtonClass} -mt-2 self-start`}>
        {label}
      </button>
    );
  }
  const href = catalogHref("/catalog", learnerId, {
    q: query.trim(),
    subject: meta.subject,
    ageGroup: meta.ageGroup,
    level: meta.level,
  });
  return (
    <Link href={href} className={`${textButtonClass} -mt-2`}>
      {label}
    </Link>
  );
}

/** «Готовые материалы»: Planeree's textbooks under the library's own search and filters. */
function CatalogMaterials({ query, meta, filter, learnerId }: { query: string; meta: MetaFilters; filter: Filter; learnerId: string | null }) {
  const data = useStore((s) => s.data);
  // The catalog has textbooks only.
  const textbooks = filter === "lessons" ? [] : searchMaterials(catalog, query, meta).textbooks;
  if (textbooks.length === 0) {
    return <EmptyState icon={<SearchX size={28} strokeWidth={1.5} aria-hidden />} title="Ничего не нашли" />;
  }
  return (
    <div className={MATERIAL_GRID}>
      {textbooks.map((t) => (
        <MaterialCard
          key={t.id}
          href={catalogHref(`/catalog/${t.id}`, learnerId)}
          kind="textbook"
          title={t.title}
          caption={t.author?.name}
          lessonCount={textbookLessonCount(t)}
          cover={t.cover}
          coverImage={t.coverImage}
          badge={textbookFromCatalog(data, t.id) && <InLibraryChip />}
        />
      ))}
    </div>
  );
}

function AddMaterial({ onSelect }: { onSelect: (kind: "textbook" | "lesson") => void }) {
  const tileClass = "mt-4 h-[calc(100%-1rem)] w-full";
  if (addableKinds.length === 1) {
    return <AddTile label="Добавить материал" className={`${tileClass} min-h-28`} onClick={() => onSelect(addableKinds[0])} />;
  }
  return (
    <Menu
      align="left"
      items={addableKinds.map((kind) => {
        const { label, icon: Icon } = kindOption[kind];
        return { label, icon: <Icon size={18} strokeWidth={1.75} aria-hidden />, onSelect: () => onSelect(kind) };
      })}
      trigger={(props) => <AddTile {...props} label="Добавить материал" className={tileClass} />}
    />
  );
}

/**
 * Material type as two checkboxes, both on by default. The last one left on can't be turned off:
 * an empty choice would hide everything.
 */
function TypeFilter({ value, onChange }: { value: Filter; onChange: (value: Filter) => void }) {
  const kinds = [
    { key: "textbooks", label: "Учебники", on: value !== "lessons" },
    { key: "lessons", label: "Уроки", on: value !== "textbooks" },
  ] as const;
  const toggle = (key: "textbooks" | "lessons", on: boolean) => {
    const other = key === "textbooks" ? "lessons" : "textbooks";
    onChange(on ? "all" : other);
  };
  return (
    <div role="group" aria-label="Тип материала" className="flex h-10 items-center gap-1">
      {kinds.map((k) => {
        const locked = k.on && kinds.every((o) => o.key === k.key || !o.on);
        return (
          <Checkbox key={k.key} label={k.label} checked={k.on} disabled={locked} onChange={(on) => toggle(k.key, on)} />
        );
      })}
    </div>
  );
}

const FOLDER_GRID = "mb-4 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3";

export function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <h3 className="mb-3 flex items-baseline gap-3">
      <span className="text-caption font-bold tracking-wider text-ink-secondary uppercase">{label}</span>
      {count !== undefined && <span className="text-caption text-ink-secondary">{count}</span>}
    </h3>
  );
}
