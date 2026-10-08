// Pure domain rules. Every mutation takes AppData and returns a new AppData;
// the input is never modified. The store (store.ts) is a thin wrapper around these.

import type {
  AppData,
  AccentColor,
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
  Textbook,
} from "./types";

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
 * Which content a context sees. Read-only: never creates a learner version,
 * so browsing the library has no side effects (spec §3.2).
 */
export function resolveLesson(
  data: AppData,
  lessonId: string,
  learnerId: string | null,
): ResolvedLesson | null {
  const lesson = data.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;
  const learnerLesson = learnerId
    ? (findLearnerLesson(data, learnerId, lessonId) ?? null)
    : null;
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
): AppData {
  const next = clone(data);
  const lesson = next.lessons.find((l) => l.id === lessonId);
  if (!lesson) return data;
  lesson.content = clone(content);
  lesson.updatedAt = now;
  return next;
}

/** Edit only this learner's version, creating it first if needed. */
export function updateLearnerLessonContent(
  data: AppData,
  learnerId: string,
  lessonId: string,
  content: MockLessonContent,
  now: string,
): AppData {
  const ensured = ensureLearnerLesson(data, learnerId, lessonId, now);
  const next = clone(ensured.data);
  const ll = next.learnerLessons.find((x) => x.id === ensured.learnerLesson.id)!;
  ll.content = clone(content);
  ll.updatedAt = now;
  return next;
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
  status: LessonSession["status"];
  lastActivityAt: string;
}

/** One entry per lesson used with the learner, newest activity first (spec §9). */
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
  for (const [llId, session] of latestByLearnerLesson) {
    const learnerLesson = data.learnerLessons.find((ll) => ll.id === llId);
    const lesson =
      learnerLesson && data.lessons.find((l) => l.id === learnerLesson.sourceLessonId);
    if (!learnerLesson || !lesson) continue;
    entries.push({
      learnerLesson,
      lesson,
      textbook: data.textbooks.find((t) => t.id === lesson.textbookId) ?? null,
      status: session.status,
      lastActivityAt: session.lastActivityAt,
    });
  }
  return entries.sort(latestFirst);
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
  const lesson = ll && data.lessons.find((l) => l.id === ll.sourceLessonId);
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

/** Non-empty folders can't be deleted until their contents are moved or deleted. */
export function deleteFolder(data: AppData, folderId: string): Result {
  if (!data.folders.some((f) => f.id === folderId)) return { ok: false, reason: "not_found" };
  if (folderItemCount(data, folderId) > 0) return { ok: false, reason: "folder_not_empty" };
  const next = clone(data);
  next.folders = next.folders.filter((f) => f.id !== folderId);
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

/** What one library location contains. Textbook lessons are not listed here. */
export function libraryLocation(data: AppData, folderId: string | null) {
  const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, "ru");
  return {
    folders: data.folders
      .filter((f) => f.parentFolderId === folderId)
      .sort((a, b) => a.name.localeCompare(b.name, "ru")),
    textbooks: data.textbooks.filter((t) => t.folderId === folderId).sort(byTitle),
    lessons: data.lessons
      .filter((l) => l.textbookId === null && l.folderId === folderId)
      .sort(byTitle),
  };
}

// ───────────────────────── Materials (spec §5.4–5.5) ─────────────────────────

export function createTextbook(
  data: AppData,
  title: string,
  folderId: string | null,
  now: string,
): { data: AppData; textbookId: string } {
  const next = clone(data);
  const textbookId = makeId("tb");
  next.textbooks.push({
    id: textbookId,
    title,
    folderId,
    sections: [],
    looseLessonIds: [],
    cover: null,
    updatedAt: now,
  });
  return { data: next, textbookId };
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
  const newTbId = makeId("tb");
  const idMap = new Map<string, string>();

  for (const lesson of data.lessons.filter((l) => l.textbookId === textbookId)) {
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
    title: copyTitle(source.title),
    sections: source.sections.map((s) => ({
      ...s,
      id: makeId("sec"),
      lessonIds: remap(s.lessonIds),
    })),
    looseLessonIds: remap(source.looseLessonIds),
    updatedAt: now,
  });
  return { data: next, textbookId: newTbId };
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

function removeLessons(next: AppData, lessonIds: string[]) {
  const ids = new Set(lessonIds);
  next.lessons = next.lessons.filter((l) => !ids.has(l.id));
  for (const id of ids) detachFromTextbooks(next, id);
}

/** Blocked while learner history depends on the lesson (spec §5.5). */
export function deleteLesson(data: AppData, lessonId: string): Result {
  if (!data.lessons.some((l) => l.id === lessonId)) return { ok: false, reason: "not_found" };
  if (lessonHasLearnerActivity(data, lessonId)) {
    return { ok: false, reason: "has_learner_activity" };
  }
  const next = clone(data);
  removeLessons(next, [lessonId]);
  return ok(next);
}

/** Deletes the textbook and its lessons; blocked if any of those lessons has learner activity. */
export function deleteTextbook(data: AppData, textbookId: string): Result {
  if (!data.textbooks.some((t) => t.id === textbookId)) return { ok: false, reason: "not_found" };
  const lessonIds = data.lessons.filter((l) => l.textbookId === textbookId).map((l) => l.id);
  if (lessonIds.some((id) => lessonHasLearnerActivity(data, id))) {
    return { ok: false, reason: "has_learner_activity" };
  }
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

/** Deletes the section together with its lessons (spec §6.1), with the same dependency rule. */
export function deleteSection(
  data: AppData,
  textbookId: string,
  sectionId: string,
  now: string,
): Result {
  const tb = data.textbooks.find((t) => t.id === textbookId);
  const section = tb?.sections.find((s) => s.id === sectionId);
  if (!tb || !section) return { ok: false, reason: "not_found" };
  if (section.lessonIds.some((id) => lessonHasLearnerActivity(data, id))) {
    return { ok: false, reason: "has_learner_activity" };
  }
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
  detachFromTextbooks(next, lessonId);
  lesson.textbookId = null;
  lesson.folderId = null;
  lesson.updatedAt = now;
  if (tb) tb.updatedAt = now;
  return next;
}

/** Lessons of a textbook in display order. */
export function textbookLessons(data: AppData, textbook: Textbook) {
  const byId = (id: string) => data.lessons.find((l) => l.id === id);
  return {
    sections: [...textbook.sections]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ section: s, lessons: s.lessonIds.map(byId).filter((l) => !!l) })),
    loose: textbook.looseLessonIds.map(byId).filter((l) => !!l),
  };
}
