// Prototype data model (spec §13). Not a final production schema.

import type { MaterialMeta } from "./meta";

export type AccentColor =
  | "pink"
  | "coral"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "violet";

export interface Teacher {
  id: string;
  name: string;
}

export interface Learner {
  id: string;
  name: string;
  type: "individual" | "group";
  avatarColor: AccentColor;
  /** Groups: their students. Each member is also a learner of type "individual". */
  memberIds?: string[];
  /** Uploaded photo or picture; initials are shown without one. */
  avatarUrl?: string;
  email?: string;
  /** Hasn't joined Planeree yet: the profile offers to send an invite. */
  invitePending?: boolean;
  /** Placeholder until the CRM sync: «Понедельник, 17:00». */
  schedule?: string[];
  /** Placeholder until the CRM sync. */
  lessonsLeft?: number;
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId: string | null;
}

/** Who made a material. Names only for now; public profiles come with teacher-made materials. */
export interface Author {
  id: string;
  name: string;
}

export interface TextbookSection {
  id: string;
  title: string;
  lessonIds: string[];
  order: number;
}

export interface Textbook {
  id: string;
  title: string;
  description: string;
  /** Also applies to every lesson inside the textbook. */
  meta: MaterialMeta;
  folderId: string | null;
  /**
   * Off: Учебник → Уроки (lessons in looseLessonIds). On: Учебник → Разделы → Уроки.
   * Can change only while the textbook has no lessons.
   */
  useSections: boolean;
  sections: TextbookSection[];
  /** Lessons of a textbook without sections. */
  looseLessonIds: string[];
  /** Generated colour cover (demo materials). */
  cover: AccentColor | null;
  /** Uploaded cover as a data URL; takes precedence over `cover`. */
  coverImage: string | null;
  /** Null = made by the teacher. Kept when a textbook is added from the catalog or duplicated. */
  author: Author | null;
  /** The catalog textbook this one was added from. The copy is independent: catalog updates don't reach it. */
  catalogSourceId: string | null;
  updatedAt: string;
}

export interface LessonBlock {
  id: string;
  type: "text" | "exercise";
  title: string;
  content: string;
  /** Set on blocks added or changed for a specific learner, so the adaptation is visible. */
  adapted?: boolean;
}

export interface MockLessonContent {
  blocks: LessonBlock[];
}

export interface Lesson {
  id: string;
  title: string;
  textbookId: string | null;
  /** Only meaningful for standalone lessons; textbook lessons live wherever the textbook lives. */
  folderId: string | null;
  content: MockLessonContent;
  cover: AccentColor | null;
  updatedAt: string;
}

/** A learner's own version of a global lesson. Unique per learnerId + sourceLessonId. */
export interface LearnerLesson {
  id: string;
  learnerId: string;
  sourceLessonId: string;
  /**
   * The learner's own title: set when adapted, or kept from the original when it is deleted from the library.
   * Null = follows the original.
   */
  title: string | null;
  content: MockLessonContent;
  createdAt: string;
  updatedAt: string;
}

export interface LessonSession {
  id: string;
  learnerId: string;
  learnerLessonId: string;
  status: "in_progress" | "completed";
  startedAt: string;
  completedAt: string | null;
  lastActivityAt: string;
}

export type HomeworkStatus = "assigned" | "completed" | "reviewed";
export type HomeworkTargetType = "lesson" | "section" | "exercise";

export interface HomeworkAssignment {
  id: string;
  learnerId: string;
  learnerLessonId: string;
  title: string;
  targetType: HomeworkTargetType;
  targetId: string;
  /** Blocks as they were at assignment time, so later edits don't change assigned homework. */
  snapshot: LessonBlock[];
  status: HomeworkStatus;
  assignedAt: string;
  completedAt: string | null;
  reviewedAt: string | null;
}

export interface AppData {
  teacher: Teacher;
  learners: Learner[];
  folders: Folder[];
  textbooks: Textbook[];
  lessons: Lesson[];
  learnerLessons: LearnerLesson[];
  sessions: LessonSession[];
  homework: HomeworkAssignment[];
}

/** Why a requested change was refused. The UI maps these to Russian messages. */
export type BlockReason = "not_found";

export type Result<T = AppData> =
  | { ok: true; data: T }
  | { ok: false; reason: BlockReason };
