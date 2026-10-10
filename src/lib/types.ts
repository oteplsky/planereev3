// Prototype data model (spec §13). Not a final production schema.

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

export interface TextbookSection {
  id: string;
  title: string;
  lessonIds: string[];
  order: number;
}

export interface Textbook {
  id: string;
  title: string;
  folderId: string | null;
  sections: TextbookSection[];
  /** Lessons that belong to the textbook but to no section (sections are optional). */
  looseLessonIds: string[];
  cover: AccentColor | null;
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
export type BlockReason =
  | "has_learner_activity"
  | "not_found";

export type Result<T = AppData> =
  | { ok: true; data: T }
  | { ok: false; reason: BlockReason };
