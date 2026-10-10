"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./Button";

/**
 * UI kit · Оверлеи: side panel for looking at or editing one thing without leaving the page.
 * Native <dialog>: focus containment, Escape closes, focus returns to the opener.
 */
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby={titleId}
      className="m-0 ml-auto h-dvh max-h-dvh w-[min(100vw,440px)] max-w-none rounded-l-lg bg-surface p-0 text-ink shadow-3 backdrop:bg-neutral-950/40"
    >
      {open && (
        <div className="flex min-h-full flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-surface px-6 pt-5 pb-2">
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            <span />
            <IconButton label="Закрыть" size="sm" onClick={onClose}>
              <X size={20} strokeWidth={1.75} />
            </IconButton>
          </div>
          <div className="flex-1 px-6 pb-8">{children}</div>
        </div>
      )}
    </dialog>
  );
}
