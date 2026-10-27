"use client";

import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { homeworkChipLabel, homeworkTextClass } from "@/components/ui/Badge";
import { Menu } from "@/components/ui/Menu";
import { toast } from "@/components/ui/Toast";
import { useStore } from "@/lib/store";
import type { HomeworkAssignment, HomeworkStatus } from "@/lib/types";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

const statusActions: Record<HomeworkStatus, { to: HomeworkStatus; label: string; icon: React.ReactNode }[]> = {
  assigned: [
    { to: "completed", label: "Отметить как выполненное", icon: <Check {...iconProps} /> },
    { to: "reviewed", label: "Отметить как проверенное", icon: <Check {...iconProps} /> },
  ],
  completed: [
    { to: "reviewed", label: "Отметить как проверенное", icon: <Check {...iconProps} /> },
    { to: "assigned", label: "Вернуть в «Назначено»", icon: <RotateCcw {...iconProps} /> },
  ],
  reviewed: [{ to: "completed", label: "Вернуть в «Выполнено»", icon: <RotateCcw {...iconProps} /> }],
};

const statusToast: Record<HomeworkStatus, string> = {
  assigned: "Задание снова назначено",
  completed: "Отмечено как выполненное",
  reviewed: "Отмечено как проверенное",
};

/** Homework status in the lesson header's status line; the text opens the status actions. */
export function HomeworkStatusMenu({ homework }: { homework: HomeworkAssignment }) {
  const setHomeworkStatus = useStore((s) => s.setHomeworkStatus);
  return (
    <Menu
      align="left"
      items={statusActions[homework.status].map((action) => ({
        label: action.label,
        icon: action.icon,
        onSelect: () => {
          setHomeworkStatus(homework.id, action.to);
          toast(statusToast[action.to]);
        },
      }))}
      trigger={(props) => (
        <button
          {...props}
          type="button"
          title={homework.title}
          aria-label={`${homeworkChipLabel[homework.status]}: ${homework.title}`}
          className={`inline-flex items-center gap-0.5 rounded-xs transition-colors duration-[120ms] hover:text-ink aria-expanded:text-ink ${homeworkTextClass(homework.status)}`}
        >
          {homeworkChipLabel[homework.status]}
          <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
        </button>
      )}
    />
  );
}
