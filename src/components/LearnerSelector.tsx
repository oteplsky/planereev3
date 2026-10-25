"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LibraryBig, Plus, Search, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Menu } from "@/components/ui/Menu";
import { contextHref } from "@/lib/context";
import { crm } from "@/lib/crm";
import { learnerTypeLabel, shortName } from "@/lib/learners";
import { useStore, useVariant } from "@/lib/store";

const ITEM_WIDTH = 104;
const GAP = 8;

interface LearnerSelectorProps {
  activeLearnerId: string | null;
}

/**
 * Primary context switch (spec §4.1). Version A: «Библиотека», «Добавить», then learners and groups.
 * Version B: «Библиотека» itself carries the «+» (add a student or a group), then learners.
 * One row shows as many as fit; «Ещё N» unfolds the rest below, with a search on top.
 */
export function LearnerSelector({ activeLearnerId }: LearnerSelectorProps) {
  const learners = useStore((s) => s.data.learners);
  const variant = useVariant();
  const listRef = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(4);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || expanded) return;
    const measure = () => setCapacity(Math.max(1, Math.floor((el.clientWidth + GAP) / (ITEM_WIDTH + GAP))));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded]);

  const { shown, hiddenCount } = useMemo(() => {
    if (expanded) {
      const q = query.trim().toLowerCase();
      return { shown: learners.filter((l) => l.name.toLowerCase().includes(q)), hiddenCount: 0 };
    }
    const shown = learners.slice(0, capacity);
    // Keep the selected learner in view, replacing the last visible slot.
    const active = learners.find((l) => l.id === activeLearnerId);
    if (active && !shown.includes(active)) shown[shown.length - 1] = active;
    return { shown, hiddenCount: learners.length - shown.length };
  }, [learners, capacity, activeLearnerId, expanded, query]);

  const collapse = () => {
    setExpanded(false);
    setQuery("");
  };

  return (
    <nav aria-label="Контекст библиотеки" className="flex flex-col gap-4 rounded-xl border border-line bg-surface px-6 py-5">
      {expanded && (
        <div className="flex items-center gap-4">
          <label className="flex h-8 w-full max-w-64 items-center gap-2 border-b border-line text-ink-secondary transition-colors duration-[120ms] focus-within:border-action">
            <Search size={16} strokeWidth={1.75} className="shrink-0" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (query ? setQuery("") : collapse())}
              placeholder="Найти ученика"
              aria-label="Найти ученика или группу"
              className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-neutral-400 [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
          <ExpandButton expanded onClick={collapse} className="ml-auto" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className={`flex min-w-0 flex-1 gap-x-2 ${expanded ? "flex-wrap gap-y-4" : ""}`}>
          {variant === "b" ? (
            <LibraryWithAdd selected={activeLearnerId === null} />
          ) : (
            <>
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
              {/* Adding a student happens in the CRM for now; the flow will move here later. */}
              <SelectorItem href={crm.students} external label="Добавить" title="Добавить ученика" selected={false} icon={<PlusCircle />} />
            </>
          )}
          {/* Collapsed, only this part clips, so the «+» menu before it isn't cut off. Expanded, it joins the wrap. */}
          <div ref={listRef} className={expanded ? "contents" : "flex min-w-0 flex-1 gap-2 overflow-hidden"}>
            {shown.map((learner) => (
              <SelectorItem
                key={learner.id}
                href={contextHref("/library", learner.id)}
                label={shortName(learner)}
                title={`${learner.name} · ${learnerTypeLabel(learner)}`}
                selected={learner.id === activeLearnerId}
                icon={<Avatar learner={learner} size="xl" />}
                onClick={collapse}
              />
            ))}
            {expanded && shown.length === 0 && (
              <p className="flex h-[5.5rem] items-center px-2 text-ink-secondary">Никого не нашли</p>
            )}
          </div>
        </div>
        {!expanded && hiddenCount > 0 && <ExpandButton label={`Ещё ${hiddenCount}`} onClick={() => setExpanded(true)} />}
      </div>
    </nav>
  );
}

function ExpandButton({ expanded = false, label, onClick, className = "" }: { expanded?: boolean; label?: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onClick}
      className={`flex h-10 shrink-0 items-center gap-2 rounded-full bg-light px-4 font-semibold transition-colors duration-[120ms] hover:bg-light-hover active:bg-light-pressed ${className}`}
    >
      {expanded ? "Свернуть" : label}
      <ChevronDown size={20} strokeWidth={1.75} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden />
    </button>
  );
}

function PlusCircle({ solid = false }: { solid?: boolean }) {
  return (
    <span
      className={`grid size-14 place-items-center rounded-full transition-colors duration-[120ms] ${
        solid
          ? "bg-action text-white group-hover:bg-action-hover"
          : "border border-dashed border-line-strong text-ink-secondary group-hover:border-action group-hover:bg-selected group-hover:text-action"
      }`}
    >
      <Plus size={24} strokeWidth={1.75} />
    </span>
  );
}

/**
 * Version B: one item for the two main actions. It opens the library — all the teacher's materials —
 * and offers to add a student or a group (in the CRM for now).
 */
function LibraryWithAdd({ selected }: { selected: boolean }) {
  const router = useRouter();
  const toCrm = () => window.location.assign(crm.students);
  return (
    <div className="shrink-0">
      <Menu
        align="left"
        items={[
          { label: "Добавить ученика", icon: <UserPlus size={18} strokeWidth={1.75} aria-hidden />, onSelect: toCrm },
          { label: "Добавить группу", icon: <Users size={18} strokeWidth={1.75} aria-hidden />, onSelect: toCrm },
        ]}
        trigger={({ onClick, ...props }) => (
          <button
            {...props}
            type="button"
            aria-current={selected ? "page" : undefined}
            onClick={() => {
              if (!selected) router.push("/library");
              onClick();
            }}
            className="group flex flex-col items-center gap-2 rounded-md py-1"
            style={{ width: ITEM_WIDTH }}
          >
            <ItemFace selected={selected} label="Библиотека" icon={<PlusCircle solid />} />
          </button>
        )}
      />
    </div>
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
  onClick?: () => void;
}

function SelectorItem({ href, label, title, selected, icon, external, onClick }: SelectorItemProps) {
  const Anchor = external ? "a" : Link;
  return (
    <Anchor
      href={href}
      title={title}
      onClick={onClick}
      aria-current={selected ? "page" : undefined}
      className="group flex shrink-0 flex-col items-center gap-2 rounded-md py-1"
      style={{ width: ITEM_WIDTH }}
    >
      <ItemFace selected={selected} label={label} icon={icon} />
    </Anchor>
  );
}

function ItemFace({ selected, label, icon }: { selected: boolean; label: string; icon: React.ReactNode }) {
  return (
    <>
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
    </>
  );
}
