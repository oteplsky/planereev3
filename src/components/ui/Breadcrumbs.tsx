import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href: string;
}

/**
 * UI kit · Навигация: path in the hierarchy; the last item is the current page, not a link.
 * A leading arrow goes one level up. On phones the trail collapses to «← Parent».
 */
export function Breadcrumbs({ items, current }: { items: Crumb[]; current: string }) {
  const parent = items.at(-1);
  return (
    <nav aria-label="Путь" className="flex min-w-0 items-center gap-2">
      {parent && (
        <Link
          href={parent.href}
          aria-label={`Назад: ${parent.label}`}
          className="grid size-10 shrink-0 place-items-center rounded-sm text-ink transition-colors duration-[120ms] hover:bg-light active:bg-light-pressed"
        >
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </Link>
      )}
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-body">
        {items.map((item, i) => {
          const isParent = i === items.length - 1;
          return (
            <li key={item.href} className={`items-center gap-1 ${isParent ? "flex min-w-0" : "hidden sm:flex"}`}>
              <Link
                href={item.href}
                className={`truncate rounded-xs font-medium hover:text-action ${isParent ? "text-ink sm:text-ink-secondary" : "text-ink-secondary"}`}
              >
                {item.label}
              </Link>
              <ChevronRight size={16} strokeWidth={1.75} className="hidden shrink-0 text-neutral-400 sm:block" aria-hidden />
            </li>
          );
        })}
        <li className="hidden sm:block">
          <span aria-current="page" className="font-semibold text-ink">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
