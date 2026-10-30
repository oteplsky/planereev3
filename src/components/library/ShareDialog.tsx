"use client";

import { useState } from "react";
import { ArrowLeft, BookmarkPlus, Eye, Link2 } from "lucide-react";
import { Button, TextButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toast";
import { openShareLink, shareSaves, shareStatus } from "@/lib/domain";
import { count, formatDate, SAVES } from "@/lib/format";
import { MIXED_TEXTBOOK_SHARE } from "@/lib/messages";
import { useStore } from "@/lib/store";
import type { AppData, ShareLink, ShareSave } from "@/lib/types";
import type { CardActions } from "./Cards";
import { saveLinkHref, viewHref, type ShareTarget } from "@/lib/share";

type Access = "view" | "save";

const accessOptions = [
  { value: "view" as const, label: "Только просмотр", icon: Eye },
  { value: "save" as const, label: "С сохранением", icon: BookmarkPlus },
];

/** How many people can save through a new link. */
type Limit = "1" | "5" | "10" | "25" | "none";
const limitOptions: { value: Limit; label: string }[] = [
  ...[1, 5, 10, 25].map((n) => ({ value: String(n) as Limit, label: count(n, SAVES) })),
  { value: "none", label: "Без ограничений" },
];

/** What's left on a link, under it. */
function linkCapacity(link: ShareLink): string {
  if (link.limit === null) return "Без ограничений";
  if (link.limit === 1) return "Сработает один раз";
  return `Осталось ${link.limit - link.saves.length} из ${link.limit}`;
}

const absolute = (href: string) => `${typeof window === "undefined" ? "" : window.location.origin}${href}`;

async function copyToClipboard(link: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(link);
    toast("Ссылка скопирована");
    return true;
  } catch {
    toast("Не удалось скопировать ссылку");
    return false;
  }
}

/** «Поделиться» in a material's menu: hidden for someone else's material, locked for a textbook with their lessons. */
export function shareAction(
  data: AppData,
  kind: ShareTarget["kind"],
  id: string,
  onShare: () => void,
): Pick<CardActions, "onShare" | "shareLockedReason"> {
  const status = shareStatus(data, kind, id);
  if (status === "foreign") return {};
  return { onShare, shareLockedReason: status === "mixed" ? MIXED_TEXTBOOK_SHARE : undefined };
}

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  target: (ShareTarget & { title: string }) | null;
}

/** «Поделиться»: an open view link, or save links for a chosen number of saves (one by default). */
export function ShareDialog({ open, onClose, target }: ShareDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={target ? `Поделиться «${target.title}»` : ""}>
      {/* Remount per open so every share starts from «Только просмотр». */}
      {open && target && <ShareForm target={{ kind: target.kind, id: target.id }} onClose={onClose} />}
    </Dialog>
  );
}

function ShareForm({ target, onClose }: { target: ShareTarget; onClose: () => void }) {
  const [access, setAccess] = useState<Access>("view");
  const [showSaves, setShowSaves] = useState(false);
  /** «Новая ссылка» goes back to picking a limit; the current link keeps working. */
  const [creating, setCreating] = useState(false);
  const [limit, setLimit] = useState<Limit>("1");
  const data = useStore((s) => s.data);
  const createShareLink = useStore((s) => s.createShareLink);
  const saveLink = creating ? undefined : openShareLink(data, target);
  const saves = shareSaves(data, target);

  if (showSaves) return <Saves saves={saves} onBack={() => setShowSaves(false)} />;

  const link = access === "view" ? absolute(viewHref(target)) : saveLink && absolute(saveLinkHref(saveLink.token));
  const copy = async () => {
    if (link && (await copyToClipboard(link))) onClose();
  };
  const create = () => {
    const token = createShareLink(target, limit === "none" ? null : Number(limit));
    setCreating(false);
    void copyToClipboard(absolute(saveLinkHref(token)));
  };

  return (
    <div className="mt-4 flex flex-col gap-4 text-ink">
      <div role="radiogroup" aria-label="Доступ" className="grid gap-2 sm:grid-cols-2">
        {accessOptions.map(({ value, label, icon: Icon }) => {
          const selected = value === access;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setAccess(value)}
              className={`flex items-center gap-3 rounded-md border px-3 py-3 text-left font-semibold transition-colors duration-[120ms] ${
                selected ? "border-action bg-selected text-action" : "border-line-strong hover:bg-hover"
              }`}
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {link ? (
            <input
              readOnly
              value={link}
              aria-label="Ссылка"
              onFocus={(e) => e.currentTarget.select()}
              className="h-10 min-w-0 flex-1 truncate rounded-sm border border-line-strong bg-light px-3 text-ink-secondary outline-none focus:border-action"
            />
          ) : (
            <div className="flex h-10 flex-1 items-center rounded-sm border border-dashed border-line-strong px-3 text-ink-secondary">
              Ссылки пока нет
            </div>
          )}
          {access === "save" && !saveLink && (
            <Select
              aria-label="Сколько раз можно сохранить"
              value={limit}
              options={limitOptions}
              allowEmpty={false}
              onChange={(value) => value && setLimit(value)}
              className="shrink-0"
            />
          )}
        </div>
        {access === "save" && (
          <div className="flex min-h-5 items-center justify-between gap-3 text-caption text-ink-secondary">
            <span>{saveLink && linkCapacity(saveLink)}</span>
            {saves.length > 0 && (
              <TextButton onClick={() => setShowSaves(true)}>Сохранили: {saves.length}</TextButton>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {access === "save" && saveLink && (
          <TextButton onClick={() => setCreating(true)} className="text-caption">
            Новая ссылка
          </TextButton>
        )}
        <Button variant="ghost" onClick={onClose} className="ml-auto">
          Отмена
        </Button>
        {link ? (
          <Button variant="primary" icon={<Link2 size={18} strokeWidth={1.75} aria-hidden />} onClick={copy}>
            Скопировать ссылку
          </Button>
        ) : (
          <Button variant="primary" icon={<Link2 size={18} strokeWidth={1.75} aria-hidden />} onClick={create}>
            Создать ссылку
          </Button>
        )}
      </div>
    </div>
  );
}

/** «Сохранили: N»: whose libraries the material went to through its links. */
function Saves({ saves, onBack }: { saves: ShareSave[]; onBack: () => void }) {
  return (
    <div className="mt-4 flex flex-col gap-4 text-ink">
      <ul className="flex flex-col divide-y divide-line">
        {saves.map((save) => (
          <li key={`${save.by.id}-${save.at}`} className="flex items-center justify-between gap-3 py-2.5">
            <span className="truncate font-semibold">{save.by.name}</span>
            <span className="shrink-0 text-ink-secondary">{formatDate(save.at)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-start">
        <Button variant="ghost" icon={<ArrowLeft size={18} strokeWidth={1.75} aria-hidden />} onClick={onBack}>
          Назад
        </Button>
      </div>
    </div>
  );
}
