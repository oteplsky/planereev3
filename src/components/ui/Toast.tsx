"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { Check } from "lucide-react";

interface ToastAction {
  label: string;
  onClick(): void;
}

interface ToastState {
  message: string | null;
  action: ToastAction | null;
  key: number;
  show(message: string, action?: ToastAction): void;
  hide(): void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  action: null,
  key: 0,
  show: (message, action) => set((s) => ({ message, action: action ?? null, key: s.key + 1 })),
  hide: () => set({ message: null, action: null }),
}));

/** Shorthand for success feedback after an action; pass an action (e.g. «Вернуть») to offer undo. */
export const toast = (message: string, action?: ToastAction) => useToast.getState().show(message, action);

/** UI kit · Обратная связь: dark pill at the bottom, announced politely. */
export function Toaster() {
  const { message, action, key, hide } = useToast();

  useEffect(() => {
    if (!message) return;
    // Undo needs time to notice and reach.
    const timer = setTimeout(hide, action ? 6000 : 3200);
    return () => clearTimeout(timer);
  }, [message, action, key, hide]);

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
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                hide();
              }}
              className="pointer-events-auto -my-1 ml-1 rounded-full px-2 py-1 font-semibold text-lime transition-colors duration-[120ms] hover:bg-white/10"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
