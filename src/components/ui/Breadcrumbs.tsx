import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href: string;
}

/** UI kit · Навигация: path in the hierarchy; the last item is the current page, not a link. */
export function Breadcrumbs({ items, current }: { items: Crumb[]; current: string }) {
  return (
    <nav aria-label="Путь">
      <ol className="flex flex-wrap items-center gap-1 text-body">
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-1">
            <Link href={item.href} className="rounded-xs font-medium text-ink-secondary hover:text-action">
              {item.label}
            </Link>
            <ChevronRight size={16} strokeWidth={1.75} className="text-neutral-400" aria-hidden />
          </li>
        ))}
        <li>
          <span aria-current="page" className="font-semibold text-ink">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
