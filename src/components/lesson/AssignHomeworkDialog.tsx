"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { HomeworkTarget } from "@/lib/domain";
import { count } from "@/lib/format";
import type { LessonBlock } from "@/lib/types";

interface AssignHomeworkDialogProps {
  open: boolean;
  /** Genitive name, e.g. «Анны». */
  learnerGenitive: string;
  blocks: LessonBlock[];
  onAssign: (target: HomeworkTarget) => void;
  onClose: () => void;
}

/**
 * Spec §10: assign the whole lesson, a section, or one exercise. With mock content,
 * theory blocks stand in for sections and exercise blocks for exercises. No deadline.
 */
export function AssignHomeworkDialog({ open, learnerGenitive, blocks, onAssign, onClose }: AssignHomeworkDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Назначить домашнее задание">
      {open && <AssignForm learnerGenitive={learnerGenitive} blocks={blocks} onAssign={onAssign} onClose={onClose} />}
    </Dialog>
  );
}

function AssignForm({ learnerGenitive, blocks, onAssign, onClose }: Omit<AssignHomeworkDialogProps, "open">) {
  const [choice, setChoice] = useState("lesson");

  const options = [
    { value: "lesson", label: "Весь урок", hint: count(blocks.length, ["блок", "блока", "блоков"]) },
    ...blocks.map((b) => ({
      value: b.id,
      label: b.title,
      hint: b.type === "exercise" ? "Упражнение" : "Раздел урока",
    })),
  ];

  const submit = () => {
    if (choice === "lesson") onAssign({ type: "lesson" });
    else {
      const block = blocks.find((b) => b.id === choice)!;
      onAssign({ type: block.type === "exercise" ? "exercise" : "section", blockId: block.id });
    }
    onClose();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p>Задание появится в домашних заданиях у {learnerGenitive}. Срок сдачи не нужен.</p>
      <fieldset className="-mx-2 mt-4 grid max-h-80 gap-1 overflow-y-auto">
        <legend className="sr-only">Что назначить</legend>
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-ink transition-colors duration-[120ms] ${
              choice === option.value ? "bg-selected" : "hover:bg-hover"
            }`}
          >
            <input
              type="radio"
              name="homework-target"
              value={option.value}
              checked={choice === option.value}
              onChange={() => setChoice(option.value)}
              className="size-5 accent-action"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{option.label}</span>
              <span className="block text-caption text-ink-secondary">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" variant="primary">
          Назначить
        </Button>
      </div>
    </form>
  );
}
