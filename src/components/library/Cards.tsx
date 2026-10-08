"use client";

import Link from "next/link";
import { Copy, Ellipsis, FolderInput, Pencil, Plus, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Cover } from "./Cover";
import type { AccentColor } from "@/lib/types";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

export interface CardActions {
  onRename(): void;
  onDelete(): void;
  onDuplicate?(): void;
  onMove?(): void;
}

function actionItems(actions: CardActions): MenuItem[] {
  const items: MenuItem[] = [{ label: "Переименовать", icon: <Pencil {...iconProps} />, onSelect: actions.onRename }];
  if (actions.onDuplicate) items.push({ label: "Создать копию", icon: <Copy {...iconProps} />, onSelect: actions.onDuplicate });
  if (actions.onMove) items.push({ label: "Переместить в папку", icon: <FolderInput {...iconProps} />, onSelect: actions.onMove });
  items.push({ label: "Удалить", icon: <Trash2 {...iconProps} />, onSelect: actions.onDelete, danger: true });
  return items;
}

function ActionsMenu({ title, actions }: { title: string; actions: CardActions }) {
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
  caption: string;
  /** Omitted in learner context: folders are managed from the global library. */
  actions?: CardActions;
}

/** Folder with a tab, on the brand "light" surface (screenshot reference). */
export function FolderCard({ href, name, caption, actions }: FolderCardProps) {
  return (
    <div className="group relative pt-3">
      <span className="absolute top-0 left-0 h-4 w-24 rounded-t-md bg-light transition-colors duration-[120ms] group-hover:bg-light-hover" />
      <div className="relative flex min-h-28 items-start justify-between gap-2 rounded-lg rounded-tl-none bg-light p-5 transition-colors duration-[120ms] group-hover:bg-light-hover">
        <div className="min-w-0">
          {/* Stretched link: the whole card opens the folder; the menu stays a separate control. */}
          <Link href={href} className="line-clamp-2 text-body-lg font-bold after:absolute after:inset-0 after:-top-3 after:rounded-lg">
            {name}
          </Link>
          <p className="mt-1 text-body text-ink-secondary">{caption}</p>
        </div>
        {actions && <ActionsMenu title={name} actions={actions} />}
      </div>
    </div>
  );
}

export function AddTile({ label, onClick }: { label: string; onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong font-semibold text-ink-secondary transition-colors duration-[120ms] hover:border-action hover:bg-selected hover:text-action"
    >
      <Plus size={22} strokeWidth={1.75} aria-hidden />
      {label}
    </button>
  );
}

interface MaterialCardProps {
  href: string;
  kind: "lesson" | "textbook";
  title: string;
  caption: string;
  cover: AccentColor | null;
  badge?: React.ReactNode;
  actions?: CardActions;
}

/** UI kit · Карточки: white, 1px #EFEFEF outline, no shadow; outline darkens on hover. */
export function MaterialCard({ href, kind, title, caption, cover, badge, actions }: MaterialCardProps) {
  return (
    <div className="group relative flex flex-col rounded-lg border border-line bg-surface transition-colors duration-[120ms] hover:border-line-strong">
      <Cover cover={cover} kind={kind} />
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="min-w-0">
          <Link href={href} className="line-clamp-2 text-body-lg font-bold after:absolute after:inset-0 after:rounded-lg">
            {title}
          </Link>
          <p className="mt-1 text-body text-ink-secondary">{caption}</p>
          {badge && <div className="mt-2">{badge}</div>}
        </div>
        {actions && <ActionsMenu title={title} actions={actions} />}
      </div>
    </div>
  );
}
