// Shared links (prototype): «Поделиться» gives one out, /shared/… opens it.

/** What «Поделиться» shares: a textbook, or one lesson (standalone or from a textbook). */
export type ShareTarget = { kind: "textbook" | "lesson"; id: string };

/** «Только просмотр»: one open link per material. */
export function viewHref({ kind, id }: ShareTarget) {
  return `/shared/${kind}/${id}`;
}

/** «С сохранением»: a one-time link, by token. */
export function saveLinkHref(token: string) {
  return `/shared/s/${token}`;
}

/** A lesson opened from a shared textbook stays inside that share: `base` is the textbook's link. */
export function sharedTextbookLessonHref(base: string, lessonId: string) {
  return `${base}/lesson/${lessonId}`;
}
