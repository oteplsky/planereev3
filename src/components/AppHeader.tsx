"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

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
      <div className="mx-auto flex h-full w-full max-w-[1264px] items-center gap-10 px-8">
        <Link href="/library" aria-label="Planeree — на главную" className="rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand SVG */}
          <img src="/planeree-logo.svg" alt="Planeree" className="h-7 w-auto" />
        </Link>

        <nav aria-label="Разделы" className="flex h-full items-stretch">
          <Link
            href="/library"
            aria-current="page"
            className="relative flex items-center px-1 font-semibold text-action after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-action"
          >
            Библиотека
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-light text-caption font-bold text-action">
            {teacherInitials}
          </span>
          <span className="hidden text-body font-semibold sm:inline">{teacher.name}</span>
        </div>
      </div>
    </header>
  );
}
