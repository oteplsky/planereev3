"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LibraryBig, Plus, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { contextHref } from "@/lib/context";
import { crm } from "@/lib/crm";
import { learnerTypeLabel, shortName } from "@/lib/learners";
import { useStore } from "@/lib/store";
import type { Learner } from "@/lib/types";

const ITEM_WIDTH = 104;
const GAP = 8;

interface LearnerSelectorProps {
  activeLearnerId: string | null;
}

/**
 * Primary context switch (spec §4.1): «Библиотека» first, then learners and groups, then «Добавить».
 * Shows as many as fit; the rest go into «Ещё N».
 */
export function LearnerSelector({ activeLearnerId }: LearnerSelectorProps) {
  const learners = useStore((s) => s.data.learners);
  const listRef = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(4);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const measure = () => {
      const slots = Math.floor((el.clientWidth + GAP) / (ITEM_WIDTH + GAP));
      setCapacity(Math.max(1, slots - 2)); // «Библиотека» and «Добавить» take a slot each
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { visible, hidden } = useMemo(() => {
    const visible = learners.slice(0, capacity);
    // Keep the selected learner in view, replacing the last visible slot.
    const active = learners.find((l) => l.id === activeLearnerId);
    if (active && !visible.includes(active)) visible[visible.length - 1] = active;
    return { visible, hidden: learners.filter((l) => !visible.includes(l)) };
  }, [learners, capacity, activeLearnerId]);

  return (
    <nav
      aria-label="Контекст библиотеки"
      className="flex items-center gap-4 rounded-xl border border-line bg-surface px-6 py-5"
    >
      <div ref={listRef} className="flex min-w-0 flex-1 gap-2 overflow-hidden">
        <SelectorItem
          href="/library"
          label="Библиотека"
          selected={activeLearnerId === null}
          icon={
            <span className="grid size-14 place-items-center rounded-full bg-action text-white">
              <LibraryBig size={26} strokeWidth={1.75} />
            </span>
          }
        />
        {visible.map((learner) => (
          <SelectorItem
            key={learner.id}
            href={contextHref("/library", learner.id)}
            label={shortName(learner)}
            title={`${learner.name} · ${learnerTypeLabel(learner)}`}
            selected={learner.id === activeLearnerId}
            icon={<Avatar learner={learner} size="xl" />}
          />
        ))}
        {/* Adding a student happens in the CRM for now; the flow will move here later. */}
        <SelectorItem
          href={crm.students}
          external
          label="Добавить"
          title="Добавить ученика"
          selected={false}
          icon={
            <span className="grid size-14 place-items-center rounded-full border border-dashed border-line-strong text-ink-secondary transition-colors duration-[120ms] group-hover:border-action group-hover:bg-selected group-hover:text-action">
              <Plus size={24} strokeWidth={1.75} />
            </span>
          }
        />
      </div>
      {hidden.length > 0 && <MoreLearners learners={hidden} />}
    </nav>
  );
}

interface SelectorItemProps {
  href: string;
  label: string;
  title?: string;
  selected: boolean;
  icon: React.ReactNode;
  /** A page outside the LMS (the CRM), opened as a regular page load. */
  external?: boolean;
}

function SelectorItem({ href, label, title, selected, icon, external }: SelectorItemProps) {
  const Anchor = external ? "a" : Link;
  return (
    <Anchor
      href={href}
      title={title}
      aria-current={selected ? "page" : undefined}
      className="group flex shrink-0 flex-col items-center gap-2 rounded-md py-1"
      style={{ width: ITEM_WIDTH }}
    >
      <span
        className={`rounded-full p-[3px] ring-2 transition-[box-shadow,transform] duration-[120ms] ${
          selected ? "ring-action" : "ring-transparent group-hover:ring-line-strong"
        }`}
      >
        {icon}
      </span>
      <span
        className={`w-full truncate text-center text-body ${
          selected ? "font-semibold text-ink" : "text-ink-secondary group-hover:text-ink"
        }`}
      >
        {label}
      </span>
    </Anchor>
  );
}

function MoreLearners({ learners }: { learners: Learner[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const matches = learners.filter((l) =>
    l.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const close = (restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const choose = (learner: Learner) => {
    close(false);
    router.push(contextHref("/library", learner.id));
  };

  return (
    <div ref={rootRef} className="relative shrink-0" onKeyDown={(e) => e.key === "Escape" && close()}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? close() : setOpen(true))}
        className="flex h-10 items-center gap-2 rounded-full bg-light px-4 font-semibold transition-colors duration-[120ms] hover:bg-light-hover active:bg-light-pressed"
      >
        Ещё {learners.length}
        <ChevronDown
          size={20}
          strokeWidth={1.75}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Другие ученики"
          className="absolute right-0 top-12 z-30 w-80 rounded-lg border border-line bg-surface p-2 shadow-2"
        >
          <label className="flex h-10 items-center gap-2 rounded-sm border border-line-strong px-3 focus-within:border-action">
            <Search size={18} strokeWidth={1.75} className="text-ink-secondary" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches[0]) choose(matches[0]);
              }}
              placeholder="Найти ученика или группу"
              aria-label="Найти ученика или группу"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>

          <ul className="mt-2 max-h-80 overflow-y-auto">
            {matches.map((learner) => (
              <li key={learner.id}>
                <button
                  type="button"
                  onClick={() => choose(learner)}
                  className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors duration-[120ms] hover:bg-hover"
                >
                  <Avatar learner={learner} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{learner.name}</span>
                    <span className="block text-caption text-ink-secondary">
                      {learnerTypeLabel(learner)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-2 py-6 text-center text-ink-secondary">Никого не нашли</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
