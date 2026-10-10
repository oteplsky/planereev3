"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { SearchField } from "@/components/ui/SearchField";
import { toast } from "@/components/ui/Toast";
import { count, MEMBERS } from "@/lib/format";
import { groupsOf } from "@/lib/learners";
import { useStore } from "@/lib/store";
import type { Learner } from "@/lib/types";

/** Pick any number of students to add to the group. Current members aren't listed. */
export function AddMembersDialog({ group, open, onClose }: { group: Learner; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Добавить учеников">
      {/* Fresh selection every time the dialog opens. */}
      {open && <MemberPicker group={group} onClose={onClose} />}
    </Dialog>
  );
}

function MemberPicker({ group, onClose }: { group: Learner; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const addGroupMembers = useStore((s) => s.addGroupMembers);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const candidates = data.learners.filter((l) => l.type === "individual" && !group.memberIds?.includes(l.id));
  const q = query.trim().toLocaleLowerCase("ru");
  const shown = candidates.filter((l) => l.name.toLocaleLowerCase("ru").includes(q));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (candidates.length === 0) {
    return (
      <div className="text-ink">
        <p className="text-ink-secondary">Все ученики уже в группе.</p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-ink">
      <SearchField value={query} onChange={setQuery} placeholder="Найти ученика" />
      <ul className="mt-3 -mx-2 max-h-80 overflow-y-auto" aria-label="Ученики">
        {shown.map((learner) => {
          const checked = selected.has(learner.id);
          const groups = groupsOf(data, learner.id);
          return (
            <li key={learner.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 transition-colors duration-[120ms] hover:bg-hover">
                <input type="checkbox" checked={checked} onChange={() => toggle(learner.id)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={`grid size-5 shrink-0 place-items-center rounded-xs border-2 transition-colors duration-[120ms] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
                    checked ? "border-action bg-action text-white" : "border-line-strong bg-surface"
                  }`}
                >
                  {checked && <Check size={14} strokeWidth={3} />}
                </span>
                <Avatar learner={learner} size="md" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{learner.name}</span>
                  {groups.length > 0 && (
                    <span className="block truncate text-caption text-ink-secondary">{groups.map((g) => g.name).join(", ")}</span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-2 py-6 text-center text-ink-secondary">Никого не нашли</li>}
      </ul>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button
          variant="primary"
          disabled={selected.size === 0}
          onClick={() => {
            addGroupMembers(group.id, [...selected]);
            toast(selected.size === 1 ? "Ученик добавлен в группу" : `В группу добавлено: ${count(selected.size, MEMBERS)}`);
            onClose();
          }}
        >
          {selected.size > 0 ? `Добавить · ${selected.size}` : "Добавить"}
        </Button>
      </div>
    </div>
  );
}
