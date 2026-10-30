"use client";

// App state persisted to localStorage. Actions delegate to the pure rules in domain.ts.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as d from "./domain";
import { catalog } from "./catalog";
import { createDemoData, createEmptyData } from "./demo-data";
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
const STORAGE_VERSION = 6;

const now = () => new Date().toISOString();

/** Prototype launcher (/prototype): which data the prototype starts from. */
export type Scenario = "demo" | "empty";
export interface PrototypeSettings {
  scenario: Scenario;
}

const seed = (scenario: Scenario) => (scenario === "empty" ? createEmptyData() : createDemoData());

type Kind = "lesson" | "textbook";
type Outcome = { ok: true } | { ok: false; reason: BlockReason };

interface Store {
  data: AppData;
  hydrated: boolean;
  prototype: PrototypeSettings;

  /** Opens the prototype with its starting data; data edited so far is replaced. */
  startPrototype(settings: PrototypeSettings): void;

  // Folders
  createFolder(name: string, parentFolderId: string | null): string;
  renameFolder(folderId: string, name: string): void;
  deleteFolder(folderId: string): Outcome;

  // Materials
  createTextbook(input: d.NewTextbook, folderId: string | null): string;
  updateTextbookDetails(textbookId: string, details: d.TextbookDetails): void;
  setTextbookCoverImage(textbookId: string, image: string | null): void;
  setUseSections(textbookId: string, useSections: boolean): void;
  createLesson(title: string, placement: d.LessonPlacement): string;
  renameMaterial(kind: Kind, id: string, title: string): void;
  moveMaterial(kind: Kind, id: string, folderId: string | null): void;
  /** Drag and drop: one location's materials in their new order. */
  reorderMaterials(order: { kind: Kind; id: string }[]): void;
  setCover(kind: Kind, id: string, cover: AccentColor | null): void;
  duplicateMaterial(kind: Kind, id: string): string;
  /** Returns the new textbook's id in the teacher's library. */
  addTextbookFromCatalog(catalogTextbookId: string): string | null;
  /** A new «С сохранением» link for `limit` saves (null = no limit). Returns its token. */
  createShareLink(target: { kind: Kind | "folder"; id: string }, limit: number | null): string;
  /** «Сохранить себе» through a link. Returns the copy's id; null once the link is used up. */
  saveFromShareLink(token: string): string | null;
  deleteMaterial(kind: Kind, id: string): Outcome;

  // Textbook structure
  addSection(textbookId: string, title: string): void;
  renameSection(textbookId: string, sectionId: string, title: string): void;
  moveSection(textbookId: string, sectionId: string, direction: -1 | 1): void;
  moveSectionTo(textbookId: string, sectionId: string, index: number): void;
  deleteSection(textbookId: string, sectionId: string): Outcome;
  moveLessonInTextbook(
    textbookId: string,
    lessonId: string,
    toSectionId: string | null,
    index?: number,
  ): void;
  removeLessonFromTextbook(lessonId: string): void;
  moveLessonToTextbook(lessonId: string, textbookId: string, sectionId: string | null): void;

  // Lesson content
  updateGlobalLessonContent(lessonId: string, content: MockLessonContent, title?: string): void;
  updateLearnerLessonContent(
    learnerId: string,
    lessonId: string,
    content: MockLessonContent,
    title?: string,
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
        prototype: { scenario: "demo" },

        startPrototype: (settings) => set({ prototype: settings, data: seed(settings.scenario) }),

        createFolder(name, parentFolderId) {
          const r = d.createFolder(data(), name, parentFolderId);
          commit(r.data);
          return r.folderId;
        },
        renameFolder: (id, name) => commit(d.renameFolder(data(), id, name)),
        deleteFolder: (id) => apply(d.deleteFolder(data(), id)),

        createTextbook(input, folderId) {
          const r = d.createTextbook(data(), input, folderId, now());
          commit(r.data);
          return r.textbookId;
        },
        updateTextbookDetails: (id, details) => commit(d.updateTextbookDetails(data(), id, details, now())),
        setTextbookCoverImage: (id, image) => commit(d.setTextbookCoverImage(data(), id, image, now())),
        setUseSections: (id, value) => commit(d.setUseSections(data(), id, value, now())),
        createLesson(title, placement) {
          const r = d.createLesson(data(), title, placement, now());
          commit(r.data);
          return r.lessonId;
        },
        renameMaterial: (kind, id, title) =>
          commit(d.renameMaterial(data(), kind, id, title, now())),
        moveMaterial: (kind, id, folderId) => commit(d.moveMaterial(data(), kind, id, folderId)),
        reorderMaterials: (order) => commit(d.reorderMaterials(data(), order)),
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
        addTextbookFromCatalog(catalogTextbookId) {
          const r = d.addTextbookFromCatalog(data(), catalog, catalogTextbookId, now());
          commit(r.data);
          return r.textbookId;
        },
        createShareLink(target, limit) {
          const r = d.createShareLink(data(), target, limit, now());
          commit(r.data);
          return r.token;
        },
        saveFromShareLink(token) {
          const r = d.saveFromShareLink(data(), token, now());
          commit(r.data);
          return r.copyId;
        },
        deleteMaterial: (kind, id) =>
          apply(kind === "lesson" ? d.deleteLesson(data(), id) : d.deleteTextbook(data(), id)),

        addSection: (tbId, title) => commit(d.addSection(data(), tbId, title, now())),
        renameSection: (tbId, sId, title) =>
          commit(d.renameSection(data(), tbId, sId, title, now())),
        moveSection: (tbId, sId, dir) => commit(d.moveSection(data(), tbId, sId, dir, now())),
        moveSectionTo: (tbId, sId, index) => commit(d.moveSectionTo(data(), tbId, sId, index, now())),
        deleteSection: (tbId, sId) => apply(d.deleteSection(data(), tbId, sId, now())),
        moveLessonInTextbook: (tbId, lessonId, toSectionId, index) =>
          commit(d.moveLessonInTextbook(data(), tbId, lessonId, toSectionId, now(), index)),
        moveLessonToTextbook: (lessonId, tbId, sectionId) =>
          commit(d.moveLessonToTextbook(data(), lessonId, tbId, sectionId, now())),
        removeLessonFromTextbook: (lessonId) =>
          commit(d.removeLessonFromTextbook(data(), lessonId, now())),

        updateGlobalLessonContent: (lessonId, content, title) =>
          commit(d.updateGlobalLessonContent(data(), lessonId, content, now(), title)),
        updateLearnerLessonContent: (learnerId, lessonId, content, title) =>
          commit(d.updateLearnerLessonContent(data(), learnerId, lessonId, content, now(), title)),

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

        resetDemoData: () => commit(seed(get().prototype.scenario)),
      };
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ data: state.data, prototype: state.prototype }),
      // Prototype: incompatible stored data is replaced rather than migrated.
      migrate: () => ({ data: createDemoData() }),
      // Same shape, older values (e.g. «Дошкольники»): mapped on load instead of replaced.
      merge: (persisted, current) => {
        const saved = persisted as { data?: AppData; prototype?: PrototypeSettings } | undefined;
        return {
          ...current,
          ...(saved?.data ? { data: d.migrateData(saved.data) } : {}),
          ...(saved?.prototype ? { prototype: { scenario: saved.prototype.scenario } } : {}),
        };
      },
      // Hydrated explicitly on the client (see StoreGate) to avoid SSR mismatches.
      skipHydration: true,
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);
