"use client";

import { useState } from "react";
import { BookmarkPlus, Eye, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toast";
import { shareRules } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { sharedHref, type ShareAccess, type ShareTarget } from "@/lib/share";

const accessOptions = [
  { value: "view" as const, label: "Только просмотр", icon: Eye },
  { value: "save" as const, label: "С сохранением", icon: BookmarkPlus },
];

const shareLink = (target: ShareTarget, access: ShareAccess) =>
  `${typeof window === "undefined" ? "" : window.location.origin}${sharedHref(target, access)}`;

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  target: (ShareTarget & { title: string }) | null;
}

/** «Поделиться»: pick what the recipient can do, then copy the link. */
export function ShareDialog({ open, onClose, target }: ShareDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={target ? `Поделиться «${target.title}»` : ""}>
      {/* Remount per open so every share starts from «Только просмотр». */}
      {open && target && <ShareForm target={target} onClose={onClose} />}
    </Dialog>
  );
}

function ShareForm({ target, onClose }: { target: ShareTarget; onClose: () => void }) {
  const [access, setAccess] = useState<ShareAccess>("view");
  const canSave = useStore((s) => shareRules(s.data, target.kind, target.id).save);
  const link = shareLink({ kind: target.kind, id: target.id }, access);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast("Ссылка скопирована");
      onClose();
    } catch {
      toast("Не удалось скопировать ссылку");
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-4 text-ink">
      <div role="radiogroup" aria-label="Доступ" className="grid gap-2 sm:grid-cols-2">
        {accessOptions.map(({ value, label, icon: Icon }) => {
          const selected = value === access;
          // Someone else's lessons inside: only for viewing.
          const locked = value === "save" && !canSave;
          return (
            <span key={value} className="group relative flex">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-disabled={locked || undefined}
                aria-describedby={locked ? "share-save-locked" : undefined}
                onClick={() => !locked && setAccess(value)}
                className={`flex flex-1 items-center gap-3 rounded-md border px-3 py-3 text-left font-semibold transition-colors duration-[120ms] ${
                  selected
                    ? "border-action bg-selected text-action"
                    : locked
                      ? "cursor-not-allowed border-line text-ink-secondary opacity-60"
                      : "border-line-strong hover:bg-hover"
                }`}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden />
                {label}
              </button>
              {locked && (
                <span
                  id="share-save-locked"
                  role="tooltip"
                  className="pointer-events-none absolute top-full left-0 z-30 mt-2 w-max max-w-72 rounded-sm bg-neutral-900 px-3 py-2 text-caption text-white opacity-0 shadow-2 transition-opacity duration-[120ms] group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  В учебнике есть чужие уроки
                </span>
              )}
            </span>
          );
        })}
      </div>

      <input
        readOnly
        value={link}
        aria-label="Ссылка"
        onFocus={(e) => e.currentTarget.select()}
        className="h-10 w-full truncate rounded-sm border border-line-strong bg-light px-3 text-ink-secondary outline-none focus:border-action"
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button variant="primary" icon={<Link2 size={18} strokeWidth={1.75} aria-hidden />} onClick={copy}>
          Скопировать ссылку
        </Button>
      </div>
    </div>
  );
}
