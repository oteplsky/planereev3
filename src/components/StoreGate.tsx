"use client";

import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";

/** Mounted once in the root layout: loads saved data from localStorage. */
export function StoreHydrator() {
  useEffect(() => {
    void useStore.persist.rehydrate();
  }, []);
  return null;
}

/**
 * Wraps a screen's content so it renders only after saved data has loaded,
 * so demo data never flashes first. Used inside pages (not the layout) so
 * every route segment still renders on the server.
 */
export function Hydrated({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  if (hydrated) return children;
  return (
    <div role="status" className="grid flex-1 place-items-center py-24 text-center">
      <div>
        <span className="mx-auto block size-6 animate-spin rounded-full border-2 border-brand-100 border-t-action" />
        <p className="mt-4 font-semibold">Загружаем библиотеку</p>
        <p className="mt-1 text-caption text-ink-secondary">Обычно это занимает секунду</p>
      </div>
    </div>
  );
}
