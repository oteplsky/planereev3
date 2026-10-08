import type { ReactNode } from "react";

/** UI kit · Системные состояния: what happened, why it matters, one next step. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-lg border border-line px-6 text-center ${compact ? "py-8" : "py-14"}`}
    >
      <span className="grid size-14 place-items-center rounded-full bg-light text-action">{icon}</span>
      <p className="mt-4 text-h3">{title}</p>
      <p className="mt-1 max-w-sm text-ink-secondary">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
