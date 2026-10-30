"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type DragEvent } from "react";
import { Copy, Ellipsis, FileText, Folder, FolderInput, FolderPlus, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Cover, StackPages } from "./Cover";
import { count, LESSONS } from "@/lib/format";
import type { AccentColor } from "@/lib/types";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export interface CardActions {
  /** Omitted where the title is edited in place (the textbook header). */
  onRename?(): void;
  onDelete(): void;
  onDuplicate?(): void;
  /** «Поделиться»: a link to view or save a copy. */
  onShare?(): void;
  onMove?(): void;
  /** Defaults to «Переместить в папку». */
  moveLabel?: string;
  /** Extra items shown before «Удалить». */
  extra?: MenuItem[];
}

function actionItems(actions: CardActions): MenuItem[] {
  const items: MenuItem[] = [];
  if (actions.onRename) items.push({ label: "Переименовать", icon: <Pencil {...iconProps} />, onSelect: actions.onRename });
  if (actions.onShare) items.push({ label: "Поделиться", icon: <Share2 {...iconProps} />, onSelect: actions.onShare });
  if (actions.onDuplicate) items.push({ label: "Создать копию", icon: <Copy {...iconProps} />, onSelect: actions.onDuplicate });
  if (actions.onMove) {
    items.push({ label: actions.moveLabel ?? "Переместить в папку", icon: <FolderInput {...iconProps} />, onSelect: actions.onMove });
  }
  if (actions.extra) items.push(...actions.extra);
  items.push({ label: "Удалить", icon: <Trash2 {...iconProps} />, onSelect: actions.onDelete, danger: true });
  return items;
}

export function ActionsMenu({ title, actions }: { title: string; actions: CardActions }) {
  return (
    <Menu
      items={actionItems(actions)}
      trigger={(props) => (
        <IconButton {...props} label={`Действия: ${title}`} size="sm" className="relative z-10">
          <Ellipsis size={20} strokeWidth={1.75} />
        </IconButton>
      )}
    />
  );
}

interface FolderCardProps {
  href: string;
  name: string;
  /** Materials inside, shown as a quiet number. */
  itemCount: number;
  /** Omitted in learner context: folders are managed from the global library. */
  actions?: CardActions;
}

const FOLDER_ROW = "h-12 rounded-md border px-3 transition-colors duration-[120ms]";

/** One-line folder row: icon, name, count. The menu shows on hover, always on touch screens. */
export function FolderCard({ href, name, itemCount, actions }: FolderCardProps) {
  return (
    <div className={`group relative flex items-center gap-3 border-line bg-surface hover:border-line-strong ${FOLDER_ROW}`}>
      <Folder size={20} strokeWidth={1.75} className="shrink-0 text-ink-secondary group-hover:text-action" aria-hidden />
      {/* Stretched link: the whole row opens the folder; the menu stays a separate control. */}
      <Link href={href} title={name} className="min-w-0 flex-1 truncate font-semibold after:absolute after:inset-0 after:rounded-md">
        {name}
      </Link>
      <span className={`text-caption text-ink-secondary tabular-nums ${actions ? "group-focus-within:hidden group-hover:hidden [@media(hover:none)]:hidden" : ""}`}>
        {itemCount}
      </span>
      {actions && (
        <div className="-mr-1.5 hidden group-focus-within:block group-hover:block [@media(hover:none)]:block">
          <ActionsMenu title={name} actions={actions} />
        </div>
      )}
    </div>
  );
}

/** Quiet «Новая папка» row before the folders, the same height as them — like «Добавить материал» before the materials. */
export function AddFolderTile({ onClick }: { onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 border-dashed border-line-strong font-semibold text-ink-secondary hover:border-action hover:bg-selected hover:text-action ${FOLDER_ROW}`}
    >
      <FolderPlus size={20} strokeWidth={1.75} aria-hidden />
      Новая папка
    </button>
  );
}

interface AddTileProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

/** Dashed «+» tile that opens a grid. Forwards its ref so it can be a menu trigger. */
export const AddTile = forwardRef<HTMLButtonElement, AddTileProps>(function AddTile(
  { label, className = "mt-3 min-h-28", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={`${className} flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 text-center font-semibold text-ink-secondary transition-colors duration-[120ms] hover:border-action hover:bg-selected hover:text-action aria-expanded:border-action aria-expanded:bg-selected aria-expanded:text-action`}
    >
      <Plus size={22} strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  );
});

/** The library's material grid: cards with covers, two columns on phones. */
export const MATERIAL_GRID = "grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(168px,1fr))]";

interface MaterialCardProps {
  href: string;
  kind: "lesson" | "textbook";
  title: string;
  caption?: string;
  /** Omit for a compact card without a cover (lessons inside a textbook). */
  cover?: AccentColor | null;
  coverImage?: string | null;
  /** Shown before the title in compact cards, e.g. the lesson number. */
  leading?: React.ReactNode;
  badge?: React.ReactNode;
  /** Textbooks: shown as a count on the cover. */
  lessonCount?: number;
  actions?: CardActions;
  /** The library's own order: the whole card is dragged to a new place. */
  reorder?: ReorderHandlers;
}

export interface ReorderHandlers {
  dragging: boolean;
  onDragStart(e: DragEvent): void;
  onDragEnd(): void;
  onDragOver(e: DragEvent): void;
}

/**
 * UI kit · Карточки: white, 1px #EFEFEF outline, no shadow; outline darkens on hover.
 * Library cards (with a cover) reserve room on top so a textbook can show as a stack of pages.
 */
export function MaterialCard({ href, kind, title, caption, cover, coverImage, leading, badge, lessonCount, actions, reorder }: MaterialCardProps) {
  const hasCover = cover !== undefined;
  const stacked = hasCover && kind === "textbook";
  const { dragging, ...dragHandlers } = reorder ?? {};

  return (
    <div
      {...(reorder ? { draggable: true, ...dragHandlers } : {})}
      className={`group relative flex flex-col transition-opacity duration-[120ms] ${hasCover ? "pt-4" : ""} ${dragging ? "opacity-40" : ""}`}
    >
      {stacked && <StackPages cover={coverImage ? null : cover} />}
      <div className="relative flex flex-1 flex-col rounded-lg border border-line bg-surface transition-colors duration-[120ms] group-hover:border-line-strong">
        {hasCover && <Cover cover={cover} kind={kind} image={coverImage} />}
        {lessonCount !== undefined && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-caption font-semibold">
            <FileText size={14} strokeWidth={2} aria-hidden />
            <span aria-hidden>{lessonCount}</span>
            <span className="sr-only">{count(lessonCount, LESSONS)}</span>
          </span>
        )}
        <div className={`flex gap-3 p-4 ${leading ? "items-center" : "items-start"}`}>
          {leading}
          <div className="min-w-0 flex-1">
            {/* Not draggable itself, so dragging moves the card rather than the link. */}
            <Link href={href} draggable={reorder ? false : undefined} className="line-clamp-2 text-body-lg font-bold after:absolute after:inset-0 after:rounded-lg">
              {title}
            </Link>
            {caption && <p className="mt-1 text-body text-ink-secondary">{caption}</p>}
            {badge && <div className="mt-2">{badge}</div>}
          </div>
          {actions && <ActionsMenu title={title} actions={actions} />}
        </div>
      </div>
    </div>
  );
}
