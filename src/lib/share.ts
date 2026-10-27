// Shared links (prototype): «Поделиться» gives one out, /shared/… opens it.

/** What a shared link lets the recipient do. */
export type ShareAccess = "view" | "save";

/** What «Поделиться» shares: a textbook, or one lesson (standalone or from a textbook). */
export type ShareTarget = { kind: "textbook" | "lesson"; id: string };

/** The link «Поделиться» gives out. */
export function sharedHref({ kind, id }: ShareTarget, access: ShareAccess) {
  return `/shared/${kind}/${id}?access=${access}`;
}

/** A lesson opened from a shared textbook stays inside that share. */
export function sharedTextbookLessonHref(textbookId: string, lessonId: string, access: ShareAccess) {
  return `/shared/textbook/${textbookId}/lesson/${lessonId}?access=${access}`;
}
