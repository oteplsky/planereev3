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

/**
 * The catalog ignores the learner context, but remembers which learner the teacher came from
 * (`?from=anna`) to offer the way back. Nothing on the catalog's own pages changes because of it.
 */
export function useReturnLearner(): Learner | null {
  const learnerId = useSearchParams().get("from");
  return useStore((s) => s.data.learners.find((l) => l.id === learnerId) ?? null);
}

/** A catalog link that keeps the way back to a learner. */
export function catalogHref(
  path: string,
  fromLearnerId: string | null,
  params: Record<string, string | null | undefined> = {},
): string {
  return contextHref(path, null, { ...params, from: fromLearnerId });
}
