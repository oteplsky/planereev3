"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { catalogHref } from "@/lib/context";
import { crm } from "@/lib/crm";
import { useStore } from "@/lib/store";

const go = (href: string) => () => window.location.assign(href);

/** Work tools first, then the account: Статистика isn't mistaken for an account setting. */
const accountMenu: MenuItem[] = [
  { label: "Статистика", onSelect: go(crm.statistics) },
  { label: "Тарифы", onSelect: go(crm.tariffs) },
  { label: "Подписка", onSelect: go(crm.subscription), divider: true },
  { label: "Профиль", onSelect: go(crm.profile) },
  { label: "Выйти", onSelect: go(crm.login) },
];

/** Top navbar (UI kit · Навигация): 64px, white, 1px bottom outline. */
export function AppHeader() {
  const teacher = useStore((s) => s.data.teacher);
  const teacherInitials = teacher.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-line bg-surface">
      <div className="mx-auto flex h-full w-full max-w-[1264px] items-center gap-4 px-4 sm:gap-10 sm:px-8">
        <Link href="/library" aria-label="Planeree — на главную" className="rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG */}
          <img src="/planeree-logo.svg" alt="Planeree" className="h-7 w-auto" />
        </Link>

        <nav aria-label="Разделы" className="-my-px flex h-full min-w-0 items-stretch gap-5 overflow-x-auto [scrollbar-width:none] sm:gap-6">
          <Suspense fallback={<NavLinks learnerId={null} inCatalog={null} />}>
            <ContextNavLinks />
          </Suspense>
        </nav>

        <div className="ml-auto">
          <Menu
            items={accountMenu}
            // On narrow screens the trigger shows only initials, so the menu says whose account it is.
            header={<p className="px-3 pt-1.5 pb-2 text-caption font-semibold text-ink-secondary lg:hidden">{teacher.name}</p>}
            trigger={(props) => (
              <button
                {...props}
                type="button"
                aria-label={`Меню: ${teacher.name}`}
                className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors duration-[120ms] hover:bg-light aria-expanded:bg-light"
              >
                <span className="grid size-8 place-items-center rounded-full bg-light text-caption font-bold text-action">
                  {teacherInitials}
                </span>
                <span className="hidden text-body font-semibold lg:inline">{teacher.name}</span>
                <ChevronDown size={16} strokeWidth={2} className="text-ink-secondary" aria-hidden />
              </button>
            )}
          />
        </div>
      </div>
    </header>
  );
}

/** In a learner context the catalog link carries the way back to that learner. */
function ContextNavLinks() {
  const learnerId = useSearchParams().get("learner");
  const inCatalog = usePathname().startsWith("/catalog");
  return <NavLinks learnerId={learnerId} inCatalog={inCatalog} />;
}

/** `inCatalog` is null while the URL is unknown (prerender): no section is marked current. */
function NavLinks({ learnerId, inCatalog }: { learnerId: string | null; inCatalog: boolean | null }) {
  return (
    <>
      <NavLink href={crm.schedule} current={false} external>
        Расписание
      </NavLink>
      <NavLink href={crm.students} current={false} external>
        Ученики
      </NavLink>
      <NavLink href="/library" current={inCatalog === false}>
        Библиотека
      </NavLink>
      <NavLink href={catalogHref("/catalog", learnerId)} current={inCatalog === true}>
        Каталог
      </NavLink>
    </>
  );
}

/** `external`: a CRM section on planeree.com, opened as a regular page load. */
function NavLink({ href, current, external, children }: { href: string; current: boolean; external?: boolean; children: ReactNode }) {
  const className = `relative flex shrink-0 items-center px-1 font-semibold whitespace-nowrap transition-colors duration-[120ms] ${
    current
      ? "text-action after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-action"
      : "text-ink-secondary hover:text-ink"
  }`;
  if (external) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      // On phones the bar scrolls sideways: keep the current section in view.
      ref={current ? (el) => el?.scrollIntoView({ block: "nearest", inline: "nearest" }) : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}
