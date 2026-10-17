/** How far a learner has got through a textbook: a thin bar and «6 из 12». */
export function Progress({ value, total, className = "" }: { value: number; total: number; className?: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span aria-hidden className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full bg-light">
        <span className="block h-full rounded-full bg-action" style={{ width: `${percent}%` }} />
      </span>
      <span className="text-caption font-semibold whitespace-nowrap text-ink-secondary">
        <span className="sr-only">Пройдено </span>
        {value} из {total}
      </span>
    </div>
  );
}
