"use client";

// App state persisted to localStorage. Actions delegate to the pure rules in domain.ts.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as d from "./domain";
import { createDemoData } from "./demo-data";
import type {
  AccentColor,
  AppData,
  BlockReason,
  HomeworkStatus,
  MockLessonContent,
  Result,
} from "./types";

const STORAGE_KEY = "planeree-library";
/** Bump when the data shape changes; stored data from older versions is replaced by demo data. */
const STORAGE_VERSION = 2;

const now = () => new Date().toISOString();

type Kind = "lesson" | "textbook";
type Outcome = { ok: true } | { ok: false; reason: BlockReason };

interface Store {
  data: AppData;
  hydrated: boolean;

  // Folders
  createFolder(name: string, parentFolderId: string | null): string;
  renameFolder(folderId: string, name: string): void;
  deleteFolder(folderId: string): Outcome;

  // Materials
  createTextbook(title: string, folderId: string | null): string;
  createLesson(title: string, placement: d.LessonPlacement): string;
  renameMaterial(kind: Kind, id: string, title: string): void;
  moveMaterial(kind: Kind, id: string, folderId: string | null): void;
  setCover(kind: Kind, id: string, cover: AccentColor | null): void;
  duplicateMaterial(kind: Kind, id: string): string;
  deleteMaterial(kind: Kind, id: string): Outcome;

  // Textbook structure
  addSection(textbookId: string, title: string): void;
  renameSection(textbookId: string, sectionId: string, title: string): void;
  moveSection(textbookId: string, sectionId: string, direction: -1 | 1): void;
  deleteSection(textbookId: string, sectionId: string): Outcome;
  moveLessonInTextbook(
    textbookId: string,
    lessonId: string,
    toSectionId: string | null,
    index?: number,
  ): void;
  removeLessonFromTextbook(lessonId: string): void;

  // Lesson content
  updateGlobalLessonContent(lessonId: string, content: MockLessonContent): void;
  updateLearnerLessonContent(
    learnerId: string,
    lessonId: string,
    content: MockLessonContent,
  ): void;

  // Lesson lifecycle
  startLesson(learnerId: string, lessonId: string): string;
  completeSession(sessionId: string): void;

  // Homework
  assignHomework(learnerId: string, lessonId: string, target: d.HomeworkTarget): string;
  setHomeworkStatus(homeworkId: string, status: HomeworkStatus): void;

  resetDemoData(): void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const data = () => get().data;
      const commit = (next: AppData) => set({ data: next });
      const apply = (result: Result): Outcome => {
        if (!result.ok) return result;
        commit(result.data);
        return { ok: true };
      };

      return {
        data: createDemoData(),
        hydrated: false,

        createFolder(name, parentFolderId) {
          const r = d.createFolder(data(), name, parentFolderId);
          commit(r.data);
          return r.folderId;
        },
        renameFolder: (id, name) => commit(d.renameFolder(data(), id, name)),
        deleteFolder: (id) => apply(d.deleteFolder(data(), id)),

        createTextbook(title, folderId) {
          const r = d.createTextbook(data(), title, folderId, now());
          commit(r.data);
          return r.textbookId;
        },
        createLesson(title, placement) {
          const r = d.createLesson(data(), title, placement, now());
          commit(r.data);
          return r.lessonId;
        },
        renameMaterial: (kind, id, title) =>
          commit(d.renameMaterial(data(), kind, id, title, now())),
        moveMaterial: (kind, id, folderId) => commit(d.moveMaterial(data(), kind, id, folderId)),
        setCover: (kind, id, cover) => commit(d.setCover(data(), kind, id, cover)),
        duplicateMaterial(kind, id) {
          if (kind === "lesson") {
            const r = d.duplicateLesson(data(), id, now());
            commit(r.data);
            return r.lessonId;
          }
          const r = d.duplicateTextbook(data(), id, now());
          commit(r.data);
          return r.textbookId;
        },
        deleteMaterial: (kind, id) =>
          apply(kind === "lesson" ? d.deleteLesson(data(), id) : d.deleteTextbook(data(), id)),

        addSection: (tbId, title) => commit(d.addSection(data(), tbId, title, now())),
        renameSection: (tbId, sId, title) =>
          commit(d.renameSection(data(), tbId, sId, title, now())),
        moveSection: (tbId, sId, dir) => commit(d.moveSection(data(), tbId, sId, dir, now())),
        deleteSection: (tbId, sId) => apply(d.deleteSection(data(), tbId, sId, now())),
        moveLessonInTextbook: (tbId, lessonId, toSectionId, index) =>
          commit(d.moveLessonInTextbook(data(), tbId, lessonId, toSectionId, now(), index)),
        removeLessonFromTextbook: (lessonId) =>
          commit(d.removeLessonFromTextbook(data(), lessonId, now())),

        updateGlobalLessonContent: (lessonId, content) =>
          commit(d.updateGlobalLessonContent(data(), lessonId, content, now())),
        updateLearnerLessonContent: (learnerId, lessonId, content) =>
          commit(d.updateLearnerLessonContent(data(), learnerId, lessonId, content, now())),

        startLesson(learnerId, lessonId) {
          const r = d.startLesson(data(), learnerId, lessonId, now());
          commit(r.data);
          return r.session.id;
        },
        completeSession: (id) => commit(d.completeSession(data(), id, now())),

        assignHomework(learnerId, lessonId, target) {
          const r = d.assignHomework(data(), learnerId, lessonId, target, now());
          commit(r.data);
          return r.assignment.id;
        },
        setHomeworkStatus: (id, status) =>
          commit(d.setHomeworkStatus(data(), id, status, now())),

        resetDemoData: () => commit(createDemoData()),
      };
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ data: state.data }),
      // Prototype: incompatible stored data is replaced rather than migrated.
      migrate: () => ({ data: createDemoData() }),
      // Hydrated explicitly on the client (see StoreGate) to avoid SSR mismatches.
      skipHydration: true,
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);
