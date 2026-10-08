"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { Check } from "lucide-react";

interface ToastState {
  message: string | null;
  key: number;
  show(message: string): void;
  hide(): void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  key: 0,
  show: (message) => set((s) => ({ message, key: s.key + 1 })),
  hide: () => set({ message: null }),
}));

/** Shorthand for success feedback after an action. */
export const toast = (message: string) => useToast.getState().show(message);

/** UI kit · Обратная связь: dark pill at the bottom, announced politely. */
export function Toaster() {
  const { message, key, hide } = useToast();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(hide, 3200);
    return () => clearTimeout(timer);
  }, [message, key, hide]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-7 z-50 flex justify-center px-4">
      {message && (
        <div
          key={key}
          className="flex animate-[toast-in_200ms_var(--ease-out)] items-center gap-2.5 rounded-full bg-neutral-950 py-2.5 pr-5 pl-3 font-semibold text-white shadow-2"
        >
          <span className="grid size-5 place-items-center rounded-full bg-success text-ink">
            <Check size={13} strokeWidth={3} />
          </span>
          {message}
        </div>
      )}
    </div>
  );
}
