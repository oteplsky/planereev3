"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  /** Starts a new group: a divider is drawn above the item. */
  divider?: boolean;
  /** Shown but unavailable; this explains why (tooltip on hover and focus). The item stays focusable. */
  lockedReason?: string;
}

interface MenuProps {
  /** Renders the trigger; spread the props onto a button. */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => ReactNode;
  items: MenuItem[];
  align?: "left" | "right";
  /** Non-interactive content above the items, e.g. whose account this is. */
  header?: ReactNode;
}

/** UI kit · Оверлеи: dropdown menu. Arrow keys move, Escape closes and returns focus. */
export function Menu({ trigger, items, align = "right", header }: MenuProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close(true);
      return;
    }
    if (e.key === "Tab") return setOpen(false);
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const current = itemRefs.current.indexOf(document.activeElement as HTMLButtonElement);
    const step = e.key === "ArrowDown" ? 1 : -1;
    itemRefs.current[(current + step + items.length) % items.length]?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((o) => !o),
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": id,
      })}
      {open && (
        <div
          id={id}
          role="menu"
          onKeyDown={onKeyDown}
          className={`absolute top-full z-30 mt-1 min-w-52 rounded-md border border-line bg-surface p-1.5 shadow-2 ${align === "right" ? "right-0" : "left-0"}`}
        >
          {header}
          {items.map((item, i) => [
            item.divider && <div key={`${item.label}-divider`} role="separator" className="-mx-1.5 my-1.5 h-px bg-line" />,
            <div key={item.label} className="group/item relative">
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                aria-disabled={item.lockedReason ? true : undefined}
                aria-describedby={item.lockedReason ? `${id}-${i}-reason` : undefined}
                onClick={() => {
                  if (item.lockedReason) return;
                  // Focus the trigger first so a dialog opened by this item returns focus there on close.
                  close(true);
                  item.onSelect();
                }}
                className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-sm px-3 py-2 text-left font-medium outline-none transition-colors duration-[120ms] ${
                  item.lockedReason
                    ? "cursor-not-allowed text-ink-secondary opacity-60"
                    : `hover:bg-hover focus-visible:bg-hover ${item.danger ? "text-danger-hover" : "text-ink"}`
                } ${item.lockedReason ? "focus-visible:bg-hover" : ""}`}
              >
                {item.icon}
                {item.label}
              </button>
              {item.lockedReason && (
                <span
                  id={`${id}-${i}-reason`}
                  role="tooltip"
                  className="pointer-events-none absolute top-full left-3 z-40 mt-1 w-max max-w-72 rounded-sm bg-neutral-900 px-3 py-2 text-caption text-white opacity-0 shadow-2 transition-opacity duration-[120ms] group-focus-within/item:opacity-100 group-hover/item:opacity-100"
                >
                  {item.lockedReason}
                </span>
              )}
            </div>,
          ])}
        </div>
      )}
    </div>
  );
}
