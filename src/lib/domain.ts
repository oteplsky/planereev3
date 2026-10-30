// Pure domain rules. Every mutation takes AppData and returns a new AppData;
// the input is never modified. The store (store.ts) is a thin wrapper around these.

import type {
  AppData,
  AccentColor,
  Author,
  BlockReason,
  Folder,
  HomeworkAssignment,
  HomeworkStatus,
  HomeworkTargetType,
  LearnerLesson,
  Lesson,
  LessonBlock,
  LessonSession,
  MockLessonContent,
  Result,
  ShareLink,
  Textbook,
} from "./types";
import { matchesFilters, migrateMeta, normalizeMeta, sortLevels, type Level, type MaterialMeta, type MetaFilters, noFilters } from "./meta";

export function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

const clone = <T>(value: T): T => structuredClone(value);
const ok = (data: AppData): Result => ({ ok: true, data });

// ───────────────────────── Lesson resolution (spec §3) ─────────────────────────

export interface ResolvedLesson {
  lesson: Lesson;
  /** Content the teacher should see in this context. */
  content: MockLessonContent;
  /** The learner's own version, if one exists. Null in the global context. */
  learnerLesson: LearnerLesson | null;
}

export function findLearnerLesson(
  data: AppData,
  learnerId: string,
  lessonId: string,
): LearnerLesson | undefined {
  return data.learnerLessons.find(
    (ll) => ll.learnerId === learnerId && ll.sourceLessonId === lessonId,
  );
}

/**
 * The lesson as a learner sees it: the original under their own title, or — once the original is deleted
 * from the library — rebuilt from their copy, outside any textbook or folder.
 */
export function lessonForCopy(data: AppData, learnerLesson: LearnerLesson): Lesson | null {
  const source = data.lessons.find((l) => l.id === learnerLesson.sourceLessonId);
  if (source) return learnerLesson.title ? { ...source, title: learnerLesson.title } : source;
  if (!learnerLesson.title) return null;
  return {
    id: learnerLesson.sourceLessonId,
    title: learnerLesson.title,
    textbookId: null,
    folderId: null,
    content: learnerLesson.content,
    cover: null,
    updatedAt: learnerLesson.updatedAt,
  };
}

/** A lesson's title in a context: the learner's own one when they have it. */
export function lessonTitleFor(data: AppData, lesson: Lesson, learnerId: string | null): string {
  return (learnerId && findLearnerLesson(data, learnerId, lesson.id)?.title) || lesson.title;
}

/**
 * Which content a context sees. Read-only: never creates a learner version,
 * so browsing the library has no side effects (spec §3.2).
 */
export function resolveLesson(
  data: AppData,
  lessonId: string,
  learnerId: string | null,
): ResolvedLesson | null {
  const learnerLesson = learnerId
    ? (findLearnerLesson(data, learnerId, lessonId) ?? null)
    : null;
  const lesson = learnerLesson
    ? lessonForCopy(data, learnerLesson)
    : data.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;
  return {
    lesson,
    content: learnerLesson ? learnerLesson.content : lesson.content,
    learnerLesson,
  };
}

/**
 * Returns the learner's version of a lesson, creating it from the current global
 * content if missing. Called only by start / adapt / assign (spec §3.2).
 */
export function ensureLearnerLesson(
  data: AppData,
  learnerId: string,
  lessonId: string,
  now: string,
): { data: AppData; learnerLesson: LearnerLesson } {
  const existing = findLearnerLesson(data, learnerId, lessonId);
  if (existing) return { data, learnerLesson: existing };

  const lesson = data.lessons.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`Lesson ${lessonId} not found`);

  const learnerLesson: LearnerLesson = {
    id: makeId("ll"),
    learnerId,
    sourceLessonId: lessonId,
    title: null,
    content: clone(lesson.content),
    createdAt: now,
    updatedAt: now,
  };
  const next = clone(data);
  next.learnerLessons.push(learnerLesson);
  return { data: next, learnerLesson };
}

// ───────────────────────── Editing content (spec §11) ─────────────────────────

/** Edit the shared lesson. Learners who already have their own version are unaffected. */
export function updateGlobalLessonContent(
  data: AppData,
  lessonId: string,
  content: MockLessonContent,
  now: string,
  title?: string,
): AppData {
  const next = clone(data);
  const lesson = next.lessons.find((l) => l.id === lessonId);
  if (!lesson) return data;
  lesson.content = clone(content);
  if (title?.trim()) lesson.title = title.trim();
  lesson.updatedAt = now;
  return next;
}

/**
 * Edit only this learner's version, creating it first if needed. A title equal to the original's
 * goes back to following it.
 */
export function updateLearnerLessonContent(
  data: AppData,
  learnerId: string,
  lessonId: string,
  content: MockLessonContent,
  now: string,
  title?: string,
): AppData {
  const ensured = ensureLearnerLesson(data, learnerId, lessonId, now);
  const next = clone(ensured.data);
  const ll = next.learnerLessons.find((x) => x.id === ensured.learnerLesson.id)!;
  ll.content = clone(content);
  const source = next.lessons.find((l) => l.id === lessonId);
  if (title?.trim()) ll.title = source && title.trim() === source.title ? null : title.trim();
  ll.updatedAt = now;
  return next;
}

/**
 * Marks blocks that are new or changed compared with `before`, for edits made in a
 * learner context. Untouched blocks keep their existing flag.
 */
export function markAdapted(before: LessonBlock[], after: LessonBlock[]): LessonBlock[] {
  const original = new Map(before.map((b) => [b.id, b]));
  return after.map((block) => {
    const prev = original.get(block.id);
    const changed = !prev || prev.title !== block.title || prev.content !== block.content || prev.type !== block.type;
    return changed ? { ...block, adapted: true } : block;
  });
}

export function newBlock(
  type: LessonBlock["type"],
  title: string,
  content: string,
): LessonBlock {
  return { id: makeId("blk"), type, title, content };
}

// ───────────────────────── Lesson lifecycle (spec §8) ─────────────────────────

function latestFirst<T extends { lastActivityAt: string }>(a: T, b: T) {
  return b.lastActivityAt.localeCompare(a.lastActivityAt);
}

/** The single current lesson: the most recently active unfinished session. */
export function getCurrentSession(
  data: AppData,
  learnerId: string,
): LessonSession | null {
  return (
    data.sessions
      .filter((s) => s.learnerId === learnerId && s.status === "in_progress")
      .sort(latestFirst)[0] ?? null
  );
}

/**
 * Start (or resume) a lesson with a learner: resolve or create their version,
 * then reuse its unfinished session or open a new one. The newest activity
 * makes it the current lesson; other unfinished lessons stay in history.
 */
export function startLesson(
  data: AppData,
  learnerId: string,
  lessonId: string,
  now: string,
): { data: AppData; session: LessonSession } {
  const ensured = ensureLearnerLesson(data, learnerId, lessonId, now);
  const next = clone(ensured.data);

  const open = next.sessions.find(
    (s) =>
      s.learnerLessonId === ensured.learnerLesson.id && s.status === "in_progress",
  );
  if (open) {
    open.lastActivityAt = now;
    return { data: next, session: open };
  }

  const session: LessonSession = {
    id: makeId("ses"),
    learnerId,
    learnerLessonId: ensured.learnerLesson.id,
    status: "in_progress",
    startedAt: now,
    completedAt: null,
    lastActivityAt: now,
  };
  next.sessions.push(session);
  return { data: next, session };
}

export function completeSession(
  data: AppData,
  sessionId: string,
  now: string,
): AppData {
  const next = clone(data);
  const session = next.sessions.find((s) => s.id === sessionId);
  if (!session || session.status === "completed") return data;
  session.status = "completed";
  session.completedAt = now;
  session.lastActivityAt = now;
  return next;
}

export interface HistoryEntry {
  learnerLesson: LearnerLesson;
  lesson: Lesson;
  textbook: Textbook | null;
  /** Null when the lesson was only used for homework. */
  status: LessonSession["status"] | null;
  /** The homework status that needs attention first, or null when none was assigned. */
  homework: HomeworkStatus | null;
  lastActivityAt: string;
}

const homeworkPriority: HomeworkStatus[] = ["assigned", "completed", "reviewed"];

/** Assigned work comes first, then work waiting for review, then reviewed. */
export function homeworkSummary(assignments: HomeworkAssignment[]): HomeworkStatus | null {
  return homeworkPriority.find((status) => assignments.some((h) => h.status === status)) ?? null;
}

/**
 * One entry per lesson used with the learner — taught or set as homework —
 * newest activity first (spec §9–10).
 */
export function getLessonHistory(data: AppData, learnerId: string): HistoryEntry[] {
  const latestByLearnerLesson = new Map<string, LessonSession>();
  for (const s of data.sessions) {
    if (s.learnerId !== learnerId) continue;
    const prev = latestByLearnerLesson.get(s.learnerLessonId);
    if (!prev || s.lastActivityAt > prev.lastActivityAt) {
      latestByLearnerLesson.set(s.learnerLessonId, s);
    }
  }

  const entries: HistoryEntry[] = [];
  for (const learnerLesson of data.learnerLessons) {
    if (learnerLesson.learnerId !== learnerId) continue;
    const session = latestByLearnerLesson.get(learnerLesson.id);
    const homework = data.homework.filter((h) => h.learnerLessonId === learnerLesson.id);
    const lesson = lessonForCopy(data, learnerLesson);
    if (!lesson || (!session && homework.length === 0)) continue;
    const activity = [
      session?.lastActivityAt,
      ...homework.flatMap((h) => [h.assignedAt, h.completedAt, h.reviewedAt]),
    ].filter((t): t is string => !!t);
    entries.push({
      learnerLesson,
      lesson,
      textbook: data.textbooks.find((t) => t.id === lesson.textbookId) ?? null,
      status: session?.status ?? null,
      homework: homeworkSummary(homework),
      lastActivityAt: activity.sort().at(-1)!,
    });
  }
  return entries.sort(latestFirst);
}

/** The learner's homework on this lesson, summarized (see `homeworkSummary`). */
export function homeworkStatusForLearner(data: AppData, learnerId: string, lessonId: string): HomeworkStatus | null {
  const ll = findLearnerLesson(data, learnerId, lessonId);
  return ll ? homeworkSummary(data.homework.filter((h) => h.learnerLessonId === ll.id)) : null;
}

/** How far a learner has got through one textbook. No learning path: nothing is suggested as next. */
export interface TextbookProgress {
  textbook: Textbook;
  total: number;
  /** Lessons whose latest session with the learner is finished. */
  completed: number;
  lastActivityAt: string;
}

/** Null when no lesson of the textbook has been taught to or set as homework for the learner. */
export function textbookProgress(data: AppData, learnerId: string, textbook: Textbook): TextbookProgress | null {
  const { sections, loose } = textbookLessons(data, textbook);
  const ordered = textbook.useSections ? sections.flatMap((s) => s.lessons) : loose;
  const entries = getLessonHistory(data, learnerId).filter((e) => e.textbook?.id === textbook.id);
  if (entries.length === 0) return null;

  const status = (lessonId: string) => entries.find((e) => e.lesson.id === lessonId)?.status ?? null;
  return {
    textbook,
    total: ordered.length,
    completed: ordered.filter((l) => status(l.id) === "completed").length,
    lastActivityAt: entries[0].lastActivityAt,
  };
}

/** Textbooks used with the learner, most recently active first. */
export function learnerTextbooks(data: AppData, learnerId: string): TextbookProgress[] {
  return data.textbooks
    .map((t) => textbookProgress(data, learnerId, t))
    .filter((p) => p !== null)
    .sort(latestFirst);
}

/** In a learner context: textbooks used with the learner first, most recent first; the rest keep their order. */
export function sortByRecentUse(data: AppData, learnerId: string, textbooks: Textbook[]): Textbook[] {
  const rank = new Map(learnerTextbooks(data, learnerId).map((p, i) => [p.textbook.id, i]));
  const at = (t: Textbook) => rank.get(t.id) ?? Infinity;
  return [...textbooks].sort((a, b) => at(a) - at(b));
}

/** Where the learner is with this lesson, if they've had it: shown on cards in a learner context. */
export function lessonStatusForLearner(
  data: AppData,
  learnerId: string,
  lessonId: string,
): LessonSession["status"] | null {
  const ll = findLearnerLesson(data, learnerId, lessonId);
  if (!ll) return null;
  const latest = data.sessions
    .filter((s) => s.learnerLessonId === ll.id)
    .sort(latestFirst)[0];
  return latest?.status ?? null;
}

/** The global lesson (and its textbook) behind a learner's lesson. */
export function lessonOfLearnerLesson(data: AppData, learnerLessonId: string) {
  const ll = data.learnerLessons.find((x) => x.id === learnerLessonId);
  const lesson = ll && lessonForCopy(data, ll);
  if (!lesson) return null;
  return { lesson, textbook: data.textbooks.find((t) => t.id === lesson.textbookId) ?? null };
}

// ───────────────────────── Homework (spec §10) ─────────────────────────

export interface HomeworkTarget {
  type: HomeworkTargetType;
  /** Block id for section/exercise targets; ignored for whole-lesson targets. */
  blockId?: string;
}

export function assignHomework(
  data: AppData,
  learnerId: string,
  lessonId: string,
  target: HomeworkTarget,
  now: string,
): { data: AppData; assignment: HomeworkAssignment } {
  const ensured = ensureLearnerLesson(data, learnerId, lessonId, now);
  const next = clone(ensured.data);
  const ll = ensured.learnerLesson;
  const lesson = next.lessons.find((l) => l.id === lessonId)!;

  let snapshot: LessonBlock[];
  let title: string;
  let targetId: string;
  if (target.type === "lesson") {
    snapshot = clone(ll.content.blocks);
    title = lesson.title;
    targetId = ll.id;
  } else {
    const block = ll.content.blocks.find((b) => b.id === target.blockId);
    if (!block) throw new Error(`Block ${target.blockId} not found`);
    snapshot = [clone(block)];
    title = block.title;
    targetId = block.id;
  }

  const assignment: HomeworkAssignment = {
    id: makeId("hw"),
    learnerId,
    learnerLessonId: ll.id,
    title,
    targetType: target.type,
    targetId,
    snapshot,
    status: "assigned",
    assignedAt: now,
    completedAt: null,
    reviewedAt: null,
  };
  next.homework.push(assignment);
  return { data: next, assignment };
}

/** Simulated status change. Moving back clears the later timestamps. */
export function setHomeworkStatus(
  data: AppData,
  homeworkId: string,
  status: HomeworkStatus,
  now: string,
): AppData {
  const next = clone(data);
  const hw = next.homework.find((h) => h.id === homeworkId);
  if (!hw) return data;
  hw.status = status;
  if (status === "assigned") {
    hw.completedAt = null;
    hw.reviewedAt = null;
  } else if (status === "completed") {
    hw.completedAt ??= now;
    hw.reviewedAt = null;
  } else {
    hw.completedAt ??= now;
    hw.reviewedAt = now;
  }
  return next;
}

export function getHomework(data: AppData, learnerId: string): HomeworkAssignment[] {
  return data.homework
    .filter((h) => h.learnerId === learnerId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
}

// ───────────────────────── Folders (spec §5.2) ─────────────────────────

export function createFolder(
  data: AppData,
  name: string,
  parentFolderId: string | null,
): { data: AppData; folderId: string } {
  const next = clone(data);
  const folderId = makeId("fld");
  next.folders.push({ id: folderId, name, parentFolderId });
  return { data: next, folderId };
}

export function renameFolder(data: AppData, folderId: string, name: string): AppData {
  const next = clone(data);
  const folder = next.folders.find((f) => f.id === folderId);
  if (!folder) return data;
  folder.name = name;
  return next;
}

export function folderItemCount(data: AppData, folderId: string): number {
  return (
    data.folders.filter((f) => f.parentFolderId === folderId).length +
    data.textbooks.filter((t) => t.folderId === folderId).length +
    data.lessons.filter((l) => l.textbookId === null && l.folderId === folderId).length
  );
}

/** The folder and every folder inside it, at any depth; parents before children. */
export function folderTree(data: AppData, folderId: string): Folder[] {
  const root = data.folders.find((f) => f.id === folderId);
  if (!root) return [];
  return [root, ...data.folders.filter((f) => f.parentFolderId === folderId).flatMap((f) => folderTree(data, f.id))];
}

/** Every textbook and standalone lesson in the folder, subfolders included. */
export function folderContents(data: AppData, folderId: string): { textbooks: Textbook[]; lessons: Lesson[] } {
  const ids = new Set(folderTree(data, folderId).map((f) => f.id));
  return {
    textbooks: data.textbooks.filter((t) => t.folderId !== null && ids.has(t.folderId)),
    lessons: data.lessons.filter((l) => l.textbookId === null && l.folderId !== null && ids.has(l.folderId)),
  };
}

/** Deleting a folder never deletes materials: whatever was inside moves to the library root. */
export function deleteFolder(data: AppData, folderId: string): Result {
  if (!data.folders.some((f) => f.id === folderId)) return { ok: false, reason: "not_found" };
  const next = clone(data);
  next.folders = next.folders.filter((f) => f.id !== folderId);
  for (const f of next.folders) if (f.parentFolderId === folderId) f.parentFolderId = null;
  for (const t of next.textbooks) if (t.folderId === folderId) t.folderId = null;
  for (const l of next.lessons) if (l.textbookId === null && l.folderId === folderId) l.folderId = null;
  return ok(next);
}

/** Folders from the root down to folderId (inclusive). */
export function folderPath(data: AppData, folderId: string | null): Folder[] {
  const path: Folder[] = [];
  let current = data.folders.find((f) => f.id === folderId);
  while (current) {
    path.unshift(current);
    current = data.folders.find((f) => f.id === current!.parentFolderId);
  }
  return path;
}

/** A set of materials: the teacher's library or the catalog. */
export type Materials = Pick<AppData, "textbooks" | "lessons">;

/** Metadata that applies to a material. Textbook lessons inherit their textbook's; standalone lessons have none yet. */
export function materialMeta(data: Materials, item: Textbook | Lesson): MaterialMeta | null {
  if ("meta" in item) return item.meta;
  return data.textbooks.find((t) => t.id === item.textbookId)?.meta ?? null;
}

/** Who made a material; null = the teacher. A lesson keeps its own author once set; otherwise it's its textbook's. */
export function materialAuthor(data: Materials, item: Textbook | Lesson): Author | null {
  if ("meta" in item) return item.author;
  if (item.author !== undefined) return item.author;
  return data.textbooks.find((t) => t.id === item.textbookId)?.author ?? null;
}

/**
 * Sharing is for the teacher's own work only. «foreign»: someone else's material (a catalog or saved
 * textbook, a lesson from one) — no «Поделиться» at all. «mixed»: an own textbook with someone else's
 * lessons — «Поделиться» is shown but locked. «own»: both view and save links.
 * A folder is «own» only when everything in it, subfolders included, is; otherwise — or when it holds
 * no materials — it is «foreign».
 */
export type ShareStatus = "own" | "mixed" | "foreign";

export function shareStatus(data: AppData, kind: "lesson" | "textbook" | "folder", id: string): ShareStatus {
  if (kind === "folder") {
    const { textbooks, lessons } = folderContents(data, id);
    const own =
      textbooks.length + lessons.length > 0 &&
      textbooks.every((t) => shareStatus(data, "textbook", t.id) === "own") &&
      lessons.every((l) => materialAuthor(data, l) === null);
    return own ? "own" : "foreign";
  }
  const item = kind === "lesson" ? data.lessons.find((l) => l.id === id) : data.textbooks.find((t) => t.id === id);
  if (!item || materialAuthor(data, item) !== null) return "foreign";
  const lessons = kind === "textbook" ? data.lessons.filter((l) => l.textbookId === id) : [];
  return lessons.every((l) => materialAuthor(data, l) === null) ? "own" : "mixed";
}

/** «Источник» filter: the teacher's own materials, or one author's. Null = everything. */
export type SourceFilter = "mine" | (string & {}) | null;

export function matchesSource(author: Author | null, source: SourceFilter): boolean {
  if (source === null) return true;
  return source === "mine" ? author === null : author?.id === source;
}

/** Authors other than the teacher whose materials are in the library, by name. */
export function libraryAuthors(data: Materials): Author[] {
  const byId = new Map<string, Author>();
  for (const item of [...data.textbooks, ...data.lessons]) {
    const author = materialAuthor(data, item);
    if (author) byId.set(author.id, author);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

/**
 * Search and filter across the whole library, wherever materials sit: textbooks and standalone
 * lessons as one flat list. Lessons inside textbooks are found through their textbook.
 * Filters combine with each other and with the query (AND).
 */
export function searchMaterials(
  data: Materials,
  query: string,
  filters: MetaFilters = noFilters,
  source: SourceFilter = null,
) {
  const q = query.trim().toLocaleLowerCase("ru");
  const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, "ru");
  const hit = (item: Textbook | Lesson) =>
    item.title.toLocaleLowerCase("ru").includes(q) &&
    matchesFilters(materialMeta(data, item), filters) &&
    matchesSource(materialAuthor(data, item), source);
  return {
    textbooks: data.textbooks.filter(hit).sort(byTitle),
    lessons: data.lessons.filter((l) => l.textbookId === null && hit(l)).sort(byTitle),
  };
}

/**
 * «Уровень» filter options: levels that materials actually have, among materials matching the
 * selected subject and age group (the level filter itself is ignored, so its own choice stays listed).
 */
export function filterLevelOptions(data: Materials, filters: MetaFilters): Level[] {
  const scope = { ...filters, level: null };
  return sortLevels(
    data.textbooks.filter((t) => matchesFilters(t.meta, scope)).flatMap((t) => (t.meta.level ? [t.meta.level] : [])),
  );
}

/** Saved data from earlier prototype versions, brought up to the current metadata options. */
export function migrateData(data: AppData): AppData {
  const migrated: AppData = {
    ...data,
    learnerLessons: data.learnerLessons.map((ll) => ({ ...ll, title: ll.title ?? null })),
    shareLinks: data.shareLinks ?? [],
    textbooks: data.textbooks.map((t) => ({
      ...t,
      meta: migrateMeta(t.meta),
      author: t.author ?? null,
      catalogSourceId: t.catalogSourceId ?? null,
    })),
  };
  // Saved before the library had its own order: the order it shows now is kept, so editing doesn't reshuffle it.
  return [null, ...data.folders.map((f) => f.id)].reduce(
    (acc, folderId) =>
      reorderMaterials(acc, libraryLocation(acc, folderId).materials.map((m) => ({ kind: m.kind, id: m.item.id }))),
    migrated,
  );
}

export type LibraryItem = { kind: "textbook"; item: Textbook } | { kind: "lesson"; item: Lesson };

/**
 * What one library location contains. Textbook lessons are not listed here.
 * Materials are in the teacher's order: new ones go first, and dragging sets the order.
 * Materials that were never placed come after the placed ones, newest first.
 */
export function libraryLocation(data: AppData, folderId: string | null) {
  const textbooks = data.textbooks.filter((t) => t.folderId === folderId);
  const lessons = data.lessons.filter((l) => l.textbookId === null && l.folderId === folderId);
  const materials: LibraryItem[] = [
    ...textbooks.map((item) => ({ kind: "textbook" as const, item })),
    ...lessons.map((item) => ({ kind: "lesson" as const, item })),
  ].sort(
    (a, b) =>
      (a.item.position ?? Infinity) - (b.item.position ?? Infinity) ||
      b.item.updatedAt.localeCompare(a.item.updatedAt) ||
      a.item.title.localeCompare(b.item.title, "ru"),
  );
  return {
    folders: data.folders
      .filter((f) => f.parentFolderId === folderId)
      .sort((a, b) => a.name.localeCompare(b.name, "ru")),
    materials,
    textbooks: materials.flatMap((m) => (m.kind === "textbook" ? [m.item] : [])),
    lessons: materials.flatMap((m) => (m.kind === "lesson" ? [m.item] : [])),
  };
}

/** A position before everything in the location: where new and newly moved materials go. */
function firstPosition(data: AppData, folderId: string | null): number {
  const { materials } = libraryLocation(data, folderId);
  return Math.min(0, ...materials.map((m) => m.item.position ?? 0)) - 1;
}

/** Drag and drop in the library: the location's materials in their new order. */
export function reorderMaterials(
  data: AppData,
  order: { kind: "lesson" | "textbook"; id: string }[],
): AppData {
  const next = clone(data);
  order.forEach(({ kind, id }, position) => {
    const item = kind === "lesson" ? next.lessons.find((l) => l.id === id) : next.textbooks.find((t) => t.id === id);
    if (item) item.position = position;
  });
  return next;
}

// ───────────────────────── Materials (spec §5.4–5.5) ─────────────────────────

export interface NewTextbook {
  title: string;
  description: string;
  meta: MaterialMeta;
}

/** New textbooks start without sections (Учебник → Уроки). */
export function createTextbook(
  data: AppData,
  input: NewTextbook,
  folderId: string | null,
  now: string,
): { data: AppData; textbookId: string } {
  const next = clone(data);
  const textbookId = makeId("tb");
  next.textbooks.push({
    id: textbookId,
    title: input.title.trim(),
    description: input.description.trim(),
    meta: normalizeMeta(input.meta),
    folderId,
    useSections: false,
    sections: [],
    looseLessonIds: [],
    cover: null,
    coverImage: null,
    author: null,
    catalogSourceId: null,
    position: firstPosition(next, folderId),
    updatedAt: now,
  });
  return { data: next, textbookId };
}

export type TextbookDetails = Partial<Pick<Textbook, "title" | "description" | "meta">>;

/** Header edits. A subject or age-group change that invalidates the level clears it. */
export function updateTextbookDetails(
  data: AppData,
  textbookId: string,
  details: TextbookDetails,
  now: string,
): AppData {
  return editTextbook(
    data,
    textbookId,
    (tb) => {
      if (details.title !== undefined && details.title.trim()) tb.title = details.title.trim();
      if (details.description !== undefined) tb.description = details.description.trim();
      if (details.meta) tb.meta = normalizeMeta(details.meta);
    },
    now,
  );
}

/** Upload, replace (an image) or remove (null) the cover. Removing also drops a generated colour cover. */
export function setTextbookCoverImage(
  data: AppData,
  textbookId: string,
  image: string | null,
  now: string,
): AppData {
  return editTextbook(
    data,
    textbookId,
    (tb) => {
      tb.coverImage = image;
      tb.cover = null;
    },
    now,
  );
}

export function textbookLessonCount(textbook: Textbook): number {
  return textbook.looseLessonIds.length + textbook.sections.reduce((n, s) => n + s.lessonIds.length, 0);
}

/**
 * «Использовать разделы». Refused once the textbook has lessons: the MVP never converts
 * one structure into the other, so nothing is moved or deleted.
 */
export function setUseSections(
  data: AppData,
  textbookId: string,
  useSections: boolean,
  now: string,
): AppData {
  const tb = data.textbooks.find((t) => t.id === textbookId);
  if (!tb || tb.useSections === useSections || textbookLessonCount(tb) > 0) return data;
  return editTextbook(data, textbookId, (t) => (t.useSections = useSections), now);
}

export interface LessonPlacement {
  folderId?: string | null;
  textbookId?: string;
  /** Section inside the textbook; omitted means "no section". */
  sectionId?: string;
}

export function createLesson(
  data: AppData,
  title: string,
  placement: LessonPlacement,
  now: string,
): { data: AppData; lessonId: string } {
  const next = clone(data);
  const lessonId = makeId("les");
  next.lessons.push({
    id: lessonId,
    title,
    textbookId: placement.textbookId ?? null,
    folderId: placement.textbookId ? null : (placement.folderId ?? null),
    content: {
      blocks: [newBlock("text", "Введение", "Здесь появится содержание урока.")],
    },
    cover: null,
    position: placement.textbookId ? undefined : firstPosition(next, placement.folderId ?? null),
    updatedAt: now,
  });
  if (placement.textbookId) {
    const tb = next.textbooks.find((t) => t.id === placement.textbookId)!;
    const section = tb.sections.find((s) => s.id === placement.sectionId);
    (section ? section.lessonIds : tb.looseLessonIds).push(lessonId);
  }
  return { data: next, lessonId };
}

export function renameMaterial(
  data: AppData,
  kind: "lesson" | "textbook",
  id: string,
  title: string,
  now: string,
): AppData {
  const next = clone(data);
  const item =
    kind === "lesson"
      ? next.lessons.find((l) => l.id === id)
      : next.textbooks.find((t) => t.id === id);
  if (!item) return data;
  item.title = title;
  item.updatedAt = now;
  return next;
}

export function moveMaterial(
  data: AppData,
  kind: "lesson" | "textbook",
  id: string,
  folderId: string | null,
): AppData {
  const next = clone(data);
  const item =
    kind === "lesson"
      ? next.lessons.find((l) => l.id === id && l.textbookId === null)
      : next.textbooks.find((t) => t.id === id);
  if (!item) return data;
  if (item.folderId !== folderId) item.position = firstPosition(next, folderId);
  item.folderId = folderId;
  return next;
}

export function setCover(
  data: AppData,
  kind: "lesson" | "textbook",
  id: string,
  cover: AccentColor | null,
): AppData {
  const next = clone(data);
  const item =
    kind === "lesson"
      ? next.lessons.find((l) => l.id === id)
      : next.textbooks.find((t) => t.id === id);
  if (!item) return data;
  item.cover = cover;
  return next;
}

/** «Копия» suffix keeps duplicates distinguishable in the grid. */
const copyTitle = (title: string) => `${title} (копия)`;

/** Duplicates a lesson as a new, independent global lesson next to the original. */
export function duplicateLesson(
  data: AppData,
  lessonId: string,
  now: string,
): { data: AppData; lessonId: string } {
  const source = data.lessons.find((l) => l.id === lessonId);
  if (!source) return { data, lessonId };
  const next = clone(data);
  const newId = makeId("les");
  next.lessons.push({
    ...clone(source),
    id: newId,
    title: copyTitle(source.title),
    content: { blocks: source.content.blocks.map((b) => ({ ...b, id: makeId("blk") })) },
    position: source.textbookId ? undefined : firstPosition(next, source.folderId),
    updatedAt: now,
  });
  if (source.textbookId) {
    const tb = next.textbooks.find((t) => t.id === source.textbookId)!;
    const list =
      tb.sections.find((s) => s.lessonIds.includes(lessonId))?.lessonIds ??
      tb.looseLessonIds;
    list.splice(list.indexOf(lessonId) + 1, 0, newId);
  }
  return { data: next, lessonId: newId };
}

/** Duplicates a textbook with fresh copies of all its lessons. Learner versions are not copied. */
export function duplicateTextbook(
  data: AppData,
  textbookId: string,
  now: string,
): { data: AppData; textbookId: string } {
  const source = data.textbooks.find((t) => t.id === textbookId);
  if (!source) return { data, textbookId };
  const next = clone(data);
  const newTbId = copyTextbookInto(
    next,
    data,
    source,
    { title: copyTitle(source.title), position: firstPosition(next, source.folderId) },
    now,
  );
  return { data: next, textbookId: newTbId };
}

/**
 * «Добавить в библиотеку»: the teacher gets their own copy of a catalog textbook at the library root.
 * The author stays; nothing links back except `catalogSourceId`, so later catalog changes never reach it.
 */
export function addTextbookFromCatalog(
  data: AppData,
  catalog: Materials,
  catalogTextbookId: string,
  now: string,
): { data: AppData; textbookId: string | null } {
  const source = catalog.textbooks.find((t) => t.id === catalogTextbookId);
  if (!source) return { data, textbookId: null };
  const next = clone(data);
  const textbookId = copyTextbookInto(next, catalog, source, { folderId: null, catalogSourceId: source.id, position: firstPosition(next, null) }, now);
  return { data: next, textbookId };
}

/** Who made a textbook, as someone it was shared with sees it: the sender, unless they took it from someone else. */
export function sharedAuthor(data: AppData, textbook: Textbook): Author {
  return textbook.author ?? { id: data.teacher.id, name: data.teacher.name };
}

/**
 * «Сохранить себе» on a shared textbook: the recipient gets their own copy at the library root,
 * credited to whoever made the original. Later changes to the original never reach it.
 */
export function saveSharedTextbook(
  data: AppData,
  textbookId: string,
  now: string,
): { data: AppData; textbookId: string | null } {
  const source = data.textbooks.find((t) => t.id === textbookId);
  if (!source) return { data, textbookId: null };
  const next = clone(data);
  const copyId = copyTextbookInto(
    next,
    data,
    source,
    {
      folderId: null,
      author: sharedAuthor(data, source),
      sharedSourceId: source.id,
      position: firstPosition(next, null),
    },
    now,
  );
  return { data: next, textbookId: copyId };
}

/** Who made a lesson, as someone it was shared with sees it. */
export function sharedLessonAuthor(data: AppData, lesson: Lesson): Author {
  return materialAuthor(data, lesson) ?? { id: data.teacher.id, name: data.teacher.name };
}

/**
 * «Сохранить себе» on a shared lesson: a standalone copy at the top of the library root, even when the
 * original sits in a textbook. Credited to whoever made the original; independent of it.
 */
export function saveSharedLesson(
  data: AppData,
  lessonId: string,
  now: string,
): { data: AppData; lessonId: string | null } {
  const source = data.lessons.find((l) => l.id === lessonId);
  if (!source) return { data, lessonId: null };
  const next = clone(data);
  const copyId = makeId("les");
  next.lessons.push({
    ...clone(source),
    id: copyId,
    textbookId: null,
    folderId: null,
    content: { blocks: source.content.blocks.map((b) => ({ ...b, id: makeId("blk") })) },
    author: sharedLessonAuthor(data, source),
    sharedSourceId: source.id,
    position: firstPosition(next, null),
    updatedAt: now,
  });
  return { data: next, lessonId: copyId };
}

/**
 * «Сохранить себе» on a shared folder: the recipient gets the folder, its subfolders and copies of
 * everything in them at the library root, as it is at the moment of saving. Every material is credited
 * to whoever made the original; the folders are just the recipient's folders.
 */
export function saveSharedFolder(data: AppData, folderId: string, now: string): { data: AppData; folderId: string | null } {
  const tree = folderTree(data, folderId);
  if (tree.length === 0) return { data, folderId: null };
  const next = clone(data);
  const folderMap = new Map(tree.map((f) => [f.id, makeId("fld")]));
  for (const f of tree) {
    next.folders.push({ id: folderMap.get(f.id)!, name: f.name, parentFolderId: f.id === folderId ? null : folderMap.get(f.parentFolderId!)! });
  }
  const { textbooks, lessons } = folderContents(data, folderId);
  for (const tb of textbooks) {
    copyTextbookInto(
      next,
      data,
      tb,
      { folderId: folderMap.get(tb.folderId!)!, author: sharedAuthor(data, tb), sharedSourceId: tb.id, position: tb.position },
      now,
    );
  }
  for (const lesson of lessons) {
    next.lessons.push({
      ...clone(lesson),
      id: makeId("les"),
      folderId: folderMap.get(lesson.folderId!)!,
      content: { blocks: lesson.content.blocks.map((b) => ({ ...b, id: makeId("blk") })) },
      author: sharedLessonAuthor(data, lesson),
      sharedSourceId: lesson.id,
      updatedAt: now,
    });
  }
  return { data: next, folderId: folderMap.get(folderId)! };
}

/** A link token: 128 random bits, URL-safe. */
function makeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** «Создать ссылку» / «Новая ссылка»: a fresh one-time save link. Older unused links keep working. */
export function createShareLink(
  data: AppData,
  target: { kind: ShareLink["kind"]; id: string },
  now: string,
): { data: AppData; token: string } {
  const token = makeToken();
  const next = clone(data);
  next.shareLinks.push({ token, kind: target.kind, materialId: target.id, createdAt: now });
  return { data: next, token };
}

export function findShareLink(data: AppData, token: string): ShareLink | undefined {
  return data.shareLinks.find((l) => l.token === token);
}

const linksFor = (data: AppData, target: { kind: ShareLink["kind"]; id: string }) =>
  data.shareLinks
    .filter((l) => l.kind === target.kind && l.materialId === target.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/** The link the share dialog shows: the newest one nobody has saved through yet. */
export function openShareLink(data: AppData, target: { kind: ShareLink["kind"]; id: string }): ShareLink | undefined {
  return linksFor(data, target).find((l) => !l.savedBy);
}

/** Who saved the material through its links, newest first. */
export function shareSaves(data: AppData, target: { kind: ShareLink["kind"]; id: string }): ShareLink[] {
  return linksFor(data, target)
    .filter((l) => l.savedBy)
    .sort((a, b) => b.savedAt!.localeCompare(a.savedAt!));
}

/**
 * «Сохранить себе» through a one-time link: the copy goes to whoever is signed in, and the link is used up.
 * A used link saves nothing more.
 */
export function saveFromShareLink(data: AppData, token: string, now: string): { data: AppData; copyId: string | null } {
  const link = findShareLink(data, token);
  if (!link || link.savedBy) return { data, copyId: null };
  let next: AppData;
  let copyId: string | null;
  if (link.kind === "textbook") ({ data: next, textbookId: copyId } = saveSharedTextbook(data, link.materialId, now));
  else if (link.kind === "folder") ({ data: next, folderId: copyId } = saveSharedFolder(data, link.materialId, now));
  else ({ data: next, lessonId: copyId } = saveSharedLesson(data, link.materialId, now));
  if (!copyId) return { data, copyId: null };
  const used = next.shareLinks.find((l) => l.token === token)!;
  Object.assign(used, { savedBy: { id: data.teacher.id, name: data.teacher.name }, savedAt: now, copyId });
  return { data: next, copyId };
}

/** The teacher's copy of a catalog textbook, if they have added it. */
export function textbookFromCatalog(data: AppData, catalogTextbookId: string): Textbook | undefined {
  return data.textbooks.find((t) => t.catalogSourceId === catalogTextbookId);
}

/** Copies a textbook and its lessons from `from` into `next` (mutated) with fresh ids. */
function copyTextbookInto(
  next: AppData,
  from: Materials,
  source: Textbook,
  overrides: Partial<Textbook>,
  now: string,
): string {
  const newTbId = makeId("tb");
  const idMap = new Map<string, string>();

  for (const lesson of from.lessons.filter((l) => l.textbookId === source.id)) {
    const newLessonId = makeId("les");
    idMap.set(lesson.id, newLessonId);
    next.lessons.push({
      ...clone(lesson),
      id: newLessonId,
      textbookId: newTbId,
      content: { blocks: lesson.content.blocks.map((b) => ({ ...b, id: makeId("blk") })) },
      updatedAt: now,
    });
  }
  const remap = (ids: string[]) => ids.map((id) => idMap.get(id)!).filter(Boolean);
  next.textbooks.push({
    ...clone(source),
    id: newTbId,
    sections: source.sections.map((s) => ({
      ...s,
      id: makeId("sec"),
      lessonIds: remap(s.lessonIds),
    })),
    looseLessonIds: remap(source.looseLessonIds),
    ...overrides,
    updatedAt: now,
  });
  return newTbId;
}

/** True when any learner has their own version (and so history or homework) of the lesson. */
export function lessonHasLearnerActivity(data: AppData, lessonId: string): boolean {
  return data.learnerLessons.some((ll) => ll.sourceLessonId === lessonId);
}

/** Why deleting this item would be refused, or null if it can be deleted. Lets the UI explain before confirming. */
export function deleteBlockReason(
  data: AppData,
  kind: "folder" | "lesson" | "textbook",
  id: string,
): BlockReason | null {
  const result =
    kind === "folder"
      ? deleteFolder(data, id)
      : kind === "lesson"
        ? deleteLesson(data, id)
        : deleteTextbook(data, id);
  return result.ok ? null : result.reason;
}

function detachFromTextbooks(next: AppData, lessonId: string) {
  for (const tb of next.textbooks) {
    tb.looseLessonIds = tb.looseLessonIds.filter((id) => id !== lessonId);
    for (const s of tb.sections) s.lessonIds = s.lessonIds.filter((id) => id !== lessonId);
  }
}

/**
 * Removes lessons from the library. Learners keep their copies — with the title they knew — so their
 * history and homework stay as they were.
 */
function removeLessons(next: AppData, lessonIds: string[]) {
  const ids = new Set(lessonIds);
  for (const ll of next.learnerLessons) {
    if (ids.has(ll.sourceLessonId)) ll.title ??= next.lessons.find((l) => l.id === ll.sourceLessonId)?.title ?? null;
  }
  next.lessons = next.lessons.filter((l) => !ids.has(l.id));
  for (const id of ids) detachFromTextbooks(next, id);
}

/** Learners who worked with the lesson keep their copy (see `removeLessons`). */
export function deleteLesson(data: AppData, lessonId: string): Result {
  if (!data.lessons.some((l) => l.id === lessonId)) return { ok: false, reason: "not_found" };
  const next = clone(data);
  removeLessons(next, [lessonId]);
  return ok(next);
}

/** Deletes the textbook and its lessons; learners keep their copies. */
export function deleteTextbook(data: AppData, textbookId: string): Result {
  if (!data.textbooks.some((t) => t.id === textbookId)) return { ok: false, reason: "not_found" };
  const lessonIds = data.lessons.filter((l) => l.textbookId === textbookId).map((l) => l.id);
  const next = clone(data);
  removeLessons(next, lessonIds);
  next.textbooks = next.textbooks.filter((t) => t.id !== textbookId);
  return ok(next);
}

// ───────────────────────── Textbook structure (spec §6) ─────────────────────────

function editTextbook(
  data: AppData,
  textbookId: string,
  edit: (tb: Textbook, next: AppData) => void,
  now: string,
): AppData {
  const next = clone(data);
  const tb = next.textbooks.find((t) => t.id === textbookId);
  if (!tb) return data;
  edit(tb, next);
  tb.sections.forEach((s, i) => (s.order = i));
  tb.updatedAt = now;
  return next;
}

export function addSection(
  data: AppData,
  textbookId: string,
  title: string,
  now: string,
): AppData {
  return editTextbook(
    data,
    textbookId,
    (tb) => tb.sections.push({ id: makeId("sec"), title, lessonIds: [], order: tb.sections.length }),
    now,
  );
}

export function renameSection(
  data: AppData,
  textbookId: string,
  sectionId: string,
  title: string,
  now: string,
): AppData {
  return editTextbook(
    data,
    textbookId,
    (tb) => {
      const s = tb.sections.find((x) => x.id === sectionId);
      if (s) s.title = title;
    },
    now,
  );
}

export function moveSection(
  data: AppData,
  textbookId: string,
  sectionId: string,
  direction: -1 | 1,
  now: string,
): AppData {
  return editTextbook(
    data,
    textbookId,
    (tb) => {
      const i = tb.sections.findIndex((s) => s.id === sectionId);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= tb.sections.length) return;
      [tb.sections[i], tb.sections[j]] = [tb.sections[j], tb.sections[i]];
    },
    now,
  );
}

/** Drag and drop: puts the section at `index` (counted after removing it). Its lessons travel with it. */
export function moveSectionTo(
  data: AppData,
  textbookId: string,
  sectionId: string,
  index: number,
  now: string,
): AppData {
  return editTextbook(
    data,
    textbookId,
    (tb) => {
      const sorted = [...tb.sections].sort((a, b) => a.order - b.order);
      const from = sorted.findIndex((s) => s.id === sectionId);
      if (from < 0) return;
      const [section] = sorted.splice(from, 1);
      sorted.splice(Math.max(0, Math.min(index, sorted.length)), 0, section);
      tb.sections = sorted;
    },
    now,
  );
}

/** Deletes the section together with its lessons (spec §6.1); learners keep their copies. */
export function deleteSection(
  data: AppData,
  textbookId: string,
  sectionId: string,
  now: string,
): Result {
  const tb = data.textbooks.find((t) => t.id === textbookId);
  const section = tb?.sections.find((s) => s.id === sectionId);
  if (!tb || !section) return { ok: false, reason: "not_found" };
  const withoutLessons = clone(data);
  removeLessons(withoutLessons, section.lessonIds);
  return ok(
    editTextbook(
      withoutLessons,
      textbookId,
      (t) => (t.sections = t.sections.filter((s) => s.id !== sectionId)),
      now,
    ),
  );
}

/** Moves a lesson to another section (or out of sections with null), optionally at an index. */
export function moveLessonInTextbook(
  data: AppData,
  textbookId: string,
  lessonId: string,
  toSectionId: string | null,
  now: string,
  index?: number,
): AppData {
  return editTextbook(
    data,
    textbookId,
    (tb, next) => {
      if (!next.lessons.some((l) => l.id === lessonId && l.textbookId === textbookId)) return;
      detachFromTextbooks(next, lessonId);
      const target =
        toSectionId === null
          ? tb.looseLessonIds
          : tb.sections.find((s) => s.id === toSectionId)?.lessonIds;
      if (!target) return;
      target.splice(index ?? target.length, 0, lessonId);
    },
    now,
  );
}

/** «Убрать из учебника»: the lesson becomes a standalone lesson at the library root. */
export function removeLessonFromTextbook(
  data: AppData,
  lessonId: string,
  now: string,
): AppData {
  const next = clone(data);
  const lesson = next.lessons.find((l) => l.id === lessonId);
  if (!lesson || !lesson.textbookId) return data;
  const tb = next.textbooks.find((t) => t.id === lesson.textbookId);
  lesson.author = materialAuthor(data, lesson);
  detachFromTextbooks(next, lessonId);
  lesson.textbookId = null;
  lesson.folderId = null;
  lesson.position = firstPosition(next, null);
  lesson.updatedAt = now;
  if (tb) tb.updatedAt = now;
  return next;
}

/**
 * «Переместить в учебник»: a standalone lesson, or one from another textbook, goes to the end of the
 * textbook (of a section when it has sections). It keeps its author and its learners' history.
 */
export function moveLessonToTextbook(
  data: AppData,
  lessonId: string,
  textbookId: string,
  sectionId: string | null,
  now: string,
): AppData {
  const lesson = data.lessons.find((l) => l.id === lessonId);
  const target = data.textbooks.find((t) => t.id === textbookId);
  if (!lesson || !target || lesson.textbookId === textbookId) return data;
  if (target.useSections !== (sectionId !== null)) return data;
  if (sectionId !== null && !target.sections.some((s) => s.id === sectionId)) return data;
  const next = clone(data);
  const moved = next.lessons.find((l) => l.id === lessonId)!;
  const from = next.textbooks.find((t) => t.id === moved.textbookId);
  moved.author = materialAuthor(data, lesson);
  detachFromTextbooks(next, lessonId);
  moved.textbookId = textbookId;
  moved.folderId = null;
  moved.position = undefined;
  moved.updatedAt = now;
  const tb = next.textbooks.find((t) => t.id === textbookId)!;
  (sectionId === null ? tb.looseLessonIds : tb.sections.find((s) => s.id === sectionId)!.lessonIds).push(lessonId);
  tb.updatedAt = now;
  if (from) from.updatedAt = now;
  return next;
}

/** Lessons of a textbook in display order. */
export function textbookLessons(data: Materials, textbook: Textbook) {
  const byId = (id: string) => data.lessons.find((l) => l.id === id);
  return {
    sections: [...textbook.sections]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ section: s, lessons: s.lessonIds.map(byId).filter((l) => !!l) })),
    loose: textbook.looseLessonIds.map(byId).filter((l) => !!l),
  };
}

/**
 * Lesson numbers as shown in the textbook: 1, 2, 3… without sections; 1.1, 1.2, 2.1… with them,
 * counted within each section.
 */
export function lessonNumbers(data: Materials, textbook: Textbook): Map<string, string> {
  const { sections, loose } = textbookLessons(data, textbook);
  const entries = textbook.useSections
    ? sections.flatMap((s, si) => s.lessons.map((l, li) => [l.id, `${si + 1}.${li + 1}`] as const))
    : loose.map((l, i) => [l.id, `${i + 1}`] as const);
  return new Map(entries);
}
