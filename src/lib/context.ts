"use client";

import { useSearchParams } from "next/navigation";
import { useStore } from "./store";
import type { Learner } from "./types";

/**
 * The active context lives in the URL (`?learner=anna`) so it survives refresh
 * and every screen can link within the same context. No param = global library.
 */
export function useActiveLearner(): Learner | null {
  const learnerId = useSearchParams().get("learner");
  return useStore((s) => s.data.learners.find((l) => l.id === learnerId) ?? null);
}

/** Builds an in-app link that keeps the learner context. */
export function contextHref(
  path: string,
  learnerId: string | null,
  params: Record<string, string | null | undefined> = {},
): string {
  const search = new URLSearchParams();
  if (learnerId) search.set("learner", learnerId);
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
