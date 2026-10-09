"use client";

import { useEffect, useRef, useState } from "react";
import { BookText, PenLine, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { newBlock } from "@/lib/domain";
import type { LessonBlock } from "@/lib/types";

const typeMeta = {
  text: { label: "Теория", Icon: BookText },
  exercise: { label: "Упражнение", Icon: PenLine },
} as const;

/** Read-only block. `adaptedLabel` (e.g. «Адаптировано для Анны») marks learner-specific blocks. */
export function BlockView({ block, adaptedLabel }: { block: LessonBlock; adaptedLabel?: string }) {
  const { label, Icon } = typeMeta[block.type];
  const showAdapted = block.adapted && adaptedLabel;
  return (
    <article
      className={`rounded-lg border bg-surface p-5 ${showAdapted ? "border-brand-200 shadow-[inset_3px_0_0_var(--color-action)]" : "border-line"}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-caption text-ink-secondary">
        <Icon size={16} strokeWidth={1.75} aria-hidden />
        <span className="font-semibold">{label}</span>
        {showAdapted && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-selected px-2 py-0.5 font-semibold text-action">
            <Sparkles size={13} strokeWidth={2} aria-hidden />
            {adaptedLabel}
          </span>
        )}
      </div>
      <h3 className="mt-2 text-h3">{block.title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-body-lg text-ink">{block.content}</p>
    </article>
  );
}

interface BlockEditorProps {
  initial: LessonBlock[];
  /** Explains whose material is being edited (spec §11.4). */
  banner: React.ReactNode;
  saveLabel: string;
  onSave: (blocks: LessonBlock[]) => void;
  onCancel: () => void;
}

/** Minimal mock-content editor: edit titles and text, add or remove blocks. Not a lesson constructor. */
export function BlockEditor({ initial, banner, saveLabel, onSave, onCancel }: BlockEditorProps) {
  const [draft, setDraft] = useState<LessonBlock[]>(() => structuredClone(initial));
  const [focusId, setFocusId] = useState<string | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const update = (id: string, patch: Partial<LessonBlock>) =>
    setDraft((blocks) => blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const add = (type: LessonBlock["type"]) => {
    const block = newBlock(type, type === "exercise" ? "Новое упражнение" : "Новый блок", "");
    setDraft((blocks) => [...blocks, block]);
    setFocusId(block.id);
  };

  const save = () =>
    onSave(draft.map((b) => ({ ...b, title: b.title.trim() || "Без названия", content: b.content.trim() })));

  return (
    <div className="flex flex-col gap-4">
      {banner}

      {draft.map((block) => (
        <EditableBlock
          key={block.id}
          block={block}
          autoFocus={block.id === focusId}
          onChange={(patch) => update(block.id, patch)}
          onRemove={() => setDraft((blocks) => blocks.filter((b) => b.id !== block.id))}
        />
      ))}
      {draft.length === 0 && <p className="text-ink-secondary">В уроке пока нет блоков.</p>}

      <div className="flex flex-wrap gap-2">
        <Button icon={<Plus size={18} strokeWidth={1.75} aria-hidden />} onClick={() => add("exercise")}>
          Добавить упражнение
        </Button>
        <Button variant="ghost" icon={<Plus size={18} strokeWidth={1.75} aria-hidden />} onClick={() => add("text")}>
          Добавить теорию
        </Button>
      </div>

      <div className="sticky bottom-4 z-10 mt-2 flex flex-wrap items-center justify-end gap-2 rounded-lg border border-line bg-surface p-3 shadow-2">
        <span className="mr-auto pl-2 text-ink-secondary">{dirty ? "Есть несохранённые изменения" : "Изменений пока нет"}</span>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="primary" onClick={save} disabled={!dirty}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

function EditableBlock({
  block,
  autoFocus,
  onChange,
  onRemove,
}: {
  block: LessonBlock;
  autoFocus: boolean;
  onChange: (patch: Partial<LessonBlock>) => void;
  onRemove: () => void;
}) {
  const { label, Icon } = typeMeta[block.type];
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus || !titleRef.current) return;
    // select() highlights but doesn't move focus; focus first so typing replaces the placeholder title.
    titleRef.current.focus();
    titleRef.current.select();
    titleRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [autoFocus]);

  const field =
    "w-full rounded-sm border border-line-strong bg-surface px-3 text-ink outline-none transition-colors focus:border-action";

  return (
    <article className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center gap-2 text-caption text-ink-secondary">
        <Icon size={16} strokeWidth={1.75} aria-hidden />
        <span className="font-semibold">{label}</span>
        <IconButton label={`Удалить блок «${block.title}»`} size="sm" className="ml-auto" onClick={onRemove}>
          <Trash2 size={18} strokeWidth={1.75} />
        </IconButton>
      </div>
      <label className="mt-2 block">
        <span className="sr-only">Заголовок</span>
        <input
          ref={titleRef}
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={`${field} h-10 font-semibold`}
        />
      </label>
      <label className="mt-2 block">
        <span className="sr-only">Содержание</span>
        <textarea
          value={block.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={3}
          placeholder="Текст задания или объяснение"
          className={`${field} resize-y py-2 placeholder:text-neutral-400`}
        />
      </label>
    </article>
  );
}
