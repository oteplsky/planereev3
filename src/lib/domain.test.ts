import { describe, expect, it } from "vitest";
import * as d from "./domain";
import { createDemoData } from "./demo-data";
import { groupsOf } from "./learners";
import type { AppData } from "./types";

const T1 = "2026-10-08T10:00:00.000Z";
const T2 = "2026-10-08T11:00:00.000Z";
const T3 = "2026-10-08T12:00:00.000Z";

const PS = "les_present_simple";
const blockTitles = (data: AppData, lessonId: string, learnerId: string | null) =>
  d.resolveLesson(data, lessonId, learnerId)!.content.blocks.map((b) => b.title);

describe("lesson resolution", () => {
  it("browsing never creates a learner version", () => {
    const data = createDemoData();
    const before = data.learnerLessons.length;
    d.resolveLesson(data, "les_daily_routines", "pasha");
    d.resolveLesson(data, "les_daily_routines", null);
    expect(data.learnerLessons).toHaveLength(before);
  });

  it("only one learner version per learner + lesson", () => {
    let data = createDemoData();
    data = d.startLesson(data, "pasha", PS, T1).data;
    data = d.updateLearnerLessonContent(data, "pasha", PS, { blocks: [] }, T2);
    data = d.assignHomework(data, "pasha", PS, { type: "lesson" }, T3).data;
    expect(
      data.learnerLessons.filter((ll) => ll.learnerId === "pasha" && ll.sourceLessonId === PS),
    ).toHaveLength(1);
  });

  it("does not mutate its input", () => {
    const data = createDemoData();
    const snapshot = JSON.stringify(data);
    d.startLesson(data, "pasha", PS, T1);
    d.updateGlobalLessonContent(data, PS, { blocks: [] }, T1);
    expect(JSON.stringify(data)).toBe(snapshot);
  });
});

describe("Scenario 3 — personalized lesson stays with its learner", () => {
  it("Anna's extra exercise is absent for Maxim and persists for Anna", () => {
    let data = createDemoData();
    const extra = d.newBlock("exercise", "Ещё одно упражнение для Анны", "…");
    const anna = d.resolveLesson(data, PS, "anna")!;
    data = d.updateLearnerLessonContent(
      data, "anna", PS, { blocks: [...anna.content.blocks, extra] }, T1,
    );

    expect(blockTitles(data, PS, "anna")).toContain("Ещё одно упражнение для Анны");
    expect(blockTitles(data, PS, "anna")).toContain("Дополнительная практика Present Simple");
    expect(blockTitles(data, PS, "maxim")).not.toContain("Ещё одно упражнение для Анны");
    expect(blockTitles(data, PS, "maxim")).not.toContain("Дополнительная практика Present Simple");
    expect(blockTitles(data, PS, null)).not.toContain("Ещё одно упражнение для Анны");
  });
});

describe("adapted blocks", () => {
  it("flags only new or changed blocks", () => {
    const before = [d.newBlock("text", "A", "a"), d.newBlock("exercise", "B", "b")];
    const added = d.newBlock("exercise", "C", "c");
    const after = [before[0], { ...before[1], content: "b2" }, added];
    expect(d.markAdapted(before, after).map((b) => !!b.adapted)).toEqual([false, true, true]);
  });

  it("demo data shows Anna's extra exercise and Maxim's vocabulary as adapted", () => {
    const data = createDemoData();
    const anna = d.resolveLesson(data, PS, "anna")!.content.blocks;
    expect(anna.filter((b) => b.adapted).map((b) => b.title)).toEqual(["Дополнительная практика Present Simple"]);
    const maxim = d.resolveLesson(data, "les_everyday_vocab", "maxim")!.content.blocks;
    expect(maxim.every((b) => b.adapted)).toBe(true);
    expect(d.resolveLesson(data, "les_everyday_vocab", null)!.content.blocks.some((b) => b.adapted)).toBe(false);
  });
});

describe("Scenario 4 — global edits do not propagate", () => {
  it("updates learners without a version, leaves Anna's version unchanged", () => {
    let data = createDemoData();
    const annaBefore = blockTitles(data, PS, "anna");
    data = d.updateGlobalLessonContent(
      data, PS, { blocks: [d.newBlock("text", "Новое правило", "…")] }, T1,
    );

    expect(blockTitles(data, PS, "anna")).toEqual(annaBefore);
    expect(blockTitles(data, PS, "maxim")).toEqual(["Новое правило"]);
    expect(blockTitles(data, PS, null)).toEqual(["Новое правило"]);
  });

  it("a learner version created after the edit starts from the updated content", () => {
    let data = createDemoData();
    data = d.updateGlobalLessonContent(
      data, PS, { blocks: [d.newBlock("text", "Новое правило", "…")] }, T1,
    );
    data = d.startLesson(data, "maxim", PS, T2).data;
    data = d.updateGlobalLessonContent(data, PS, { blocks: [] }, T3);
    expect(blockTitles(data, PS, "maxim")).toEqual(["Новое правило"]);
  });
});

describe("Scenario 5 — lesson history", () => {
  it("a started lesson becomes current; completing it moves it to history", () => {
    let data = createDemoData();
    const started = d.startLesson(data, "sofia", "les_daily_routines", T1);
    data = started.data;
    expect(d.getCurrentSession(data, "sofia")?.id).toBe(started.session.id);

    data = d.completeSession(data, started.session.id, T2);
    expect(d.getCurrentSession(data, "sofia")).toBeNull();

    const [latest] = d.getLessonHistory(data, "sofia");
    expect(latest.lesson.id).toBe("les_daily_routines");
    expect(latest.textbook?.title).toBe("English File Elementary");
    expect(latest.status).toBe("completed");
  });

  it("history is newest first, one entry per lesson", () => {
    let data = createDemoData();
    const first = d.startLesson(data, "sofia", "les_past_simple", T1);
    data = d.completeSession(first.data, first.session.id, T2);
    const history = d.getLessonHistory(data, "sofia");
    expect(history.map((h) => h.lesson.id)).toEqual([
      "les_past_simple", "les_hobbies", "les_my_weekend",
    ]);
  });
});

describe("lesson status for a learner", () => {
  it("reflects the latest session, and is null when only browsed or only assigned", () => {
    let data = createDemoData();
    expect(d.lessonStatusForLearner(data, "anna", PS)).toBe("in_progress");
    expect(d.lessonStatusForLearner(data, "anna", "les_introductions")).toBe("completed");
    expect(d.lessonStatusForLearner(data, "maxim", PS)).toBeNull();
    data = d.assignHomework(data, "maxim", PS, { type: "lesson" }, T1).data;
    expect(d.lessonStatusForLearner(data, "maxim", PS)).toBeNull();
  });
});

describe("Scenario 6 — resume unfinished lesson", () => {
  it("Anna has a current lesson from demo data", () => {
    const data = createDemoData();
    const current = d.getCurrentSession(data, "anna")!;
    expect(current.learnerLessonId).toBe("ll_anna_ps");
  });

  it("opening another lesson makes it current; the previous one stays unfinished", () => {
    let data = createDemoData();
    data = d.startLesson(data, "anna", "les_daily_routines", T1).data;
    const current = d.getCurrentSession(data, "anna")!;
    const currentLesson = data.learnerLessons.find((ll) => ll.id === current.learnerLessonId)!;
    expect(currentLesson.sourceLessonId).toBe("les_daily_routines");
    const history = d.getLessonHistory(data, "anna");
    expect(history.find((h) => h.lesson.id === PS)?.status).toBe("in_progress");
  });

  it("re-opening an unfinished lesson resumes the same session", () => {
    let data = createDemoData();
    const r = d.startLesson(data, "anna", PS, T1);
    expect(r.session.id).toBe("ses_anna_ps");
    data = r.data;
    expect(data.sessions.filter((s) => s.learnerLessonId === "ll_anna_ps")).toHaveLength(1);
  });

  it("a learner with nothing unfinished has no current lesson", () => {
    expect(d.getCurrentSession(createDemoData(), "maxim")).toBeNull();
  });
});

describe("Scenario 7 — homework", () => {
  it("assigning creates the learner version and an assignment; statuses advance", () => {
    let data = createDemoData();
    const r = d.assignHomework(
      data, "maxim", PS, { type: "exercise", blockId: "blk_ps_2" }, T1,
    );
    data = r.data;
    expect(d.findLearnerLesson(data, "maxim", PS)).toBeDefined();
    expect(d.getHomework(data, "maxim")[0].id).toBe(r.assignment.id);
    expect(r.assignment.title).toBe("Упражнение 1. Вставьте глагол");

    data = d.setHomeworkStatus(data, r.assignment.id, "completed", T2);
    data = d.setHomeworkStatus(data, r.assignment.id, "reviewed", T3);
    const hw = data.homework.find((h) => h.id === r.assignment.id)!;
    expect(hw.status).toBe("reviewed");
    expect(hw.completedAt).toBe(T2);
    expect(hw.reviewedAt).toBe(T3);
  });

  it("homework-only lessons show in the history with their homework status", () => {
    let data = createDemoData();
    data = d.assignHomework(data, "pasha", "les_daily_routines", { type: "lesson" }, "2099-01-01T00:00:00.000Z").data;
    const [latest] = d.getLessonHistory(data, "pasha");
    expect(latest.lesson.id).toBe("les_daily_routines");
    expect(latest.status).toBeNull();
    expect(latest.homework).toBe("assigned");
  });

  it("summarizes several assignments by what needs attention first", () => {
    const hw = (status: "assigned" | "completed" | "reviewed") => ({ status }) as Parameters<typeof d.homeworkSummary>[0][number];
    expect(d.homeworkSummary([])).toBeNull();
    expect(d.homeworkSummary([hw("reviewed"), hw("completed")])).toBe("completed");
    expect(d.homeworkSummary([hw("reviewed"), hw("assigned")])).toBe("assigned");
  });

  it("keeps the version that existed at assignment time", () => {
    let data = createDemoData();
    const r = d.assignHomework(data, "maxim", PS, { type: "lesson" }, T1);
    data = d.updateLearnerLessonContent(r.data, "maxim", PS, { blocks: [] }, T2);
    const hw = data.homework.find((h) => h.id === r.assignment.id)!;
    expect(hw.snapshot.length).toBeGreaterThan(0);
  });
});

describe("library management", () => {
  it("deleting a folder moves everything inside it to the library root", () => {
    const data = createDemoData();
    const inside = d.libraryLocation(data, "fld_grammar");
    const r = d.deleteFolder(data, "fld_grammar");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.folders.some((f) => f.id === "fld_grammar")).toBe(false);
    const root = d.libraryLocation(r.data, null);
    for (const t of inside.textbooks) expect(root.textbooks.map((x) => x.id)).toContain(t.id);
    for (const l of inside.lessons) expect(root.lessons.map((x) => x.id)).toContain(l.id);
    expect(r.data.lessons).toHaveLength(data.lessons.length);
  });

  it("deletes an empty folder", () => {
    let data = createDemoData();
    const created = d.createFolder(data, "Пустая", null);
    const r = d.deleteFolder(created.data, created.folderId);
    expect(r.ok).toBe(true);
    data = r.ok ? r.data : data;
    expect(data.folders.some((f) => f.id === created.folderId)).toBe(false);
  });

  it("blocks deleting materials that learner history depends on", () => {
    const data = createDemoData();
    expect(d.deleteLesson(data, PS)).toEqual({ ok: false, reason: "has_learner_activity" });
    expect(d.deleteTextbook(data, "tb_ef_elementary").ok).toBe(false);
    expect(d.deleteSection(data, "tb_ef_elementary", "sec_efe_1", T1).ok).toBe(false);
    expect(d.deleteLesson(data, "les_weather").ok).toBe(true);
    const unused = d.createTextbook(data, "Новый учебник", null, T1);
    expect(d.deleteTextbook(unused.data, unused.textbookId).ok).toBe(true);
  });

  it("deleting a section removes its lessons", () => {
    const data = createDemoData();
    const r = d.deleteSection(data, "tb_grammar_a2", "sec_gpa_2", T1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.lessons.some((l) => l.id === "les_articles")).toBe(false);
    expect(r.data.textbooks.find((t) => t.id === "tb_grammar_a2")!.sections).toHaveLength(1);
  });

  it("removing a lesson from a textbook moves it to the library root", () => {
    const data = d.removeLessonFromTextbook(createDemoData(), "les_articles", T1);
    const lesson = data.lessons.find((l) => l.id === "les_articles")!;
    expect(lesson).toMatchObject({ textbookId: null, folderId: null });
    const tb = data.textbooks.find((t) => t.id === "tb_grammar_a2")!;
    expect(tb.sections.flatMap((s) => s.lessonIds)).not.toContain("les_articles");
  });

  it("moves lessons between sections and reorders sections", () => {
    let data = createDemoData();
    data = d.moveLessonInTextbook(data, "tb_ef_elementary", PS, "sec_efe_2", T1, 0);
    let tb = data.textbooks.find((t) => t.id === "tb_ef_elementary")!;
    expect(tb.sections[1].lessonIds[0]).toBe(PS);
    expect(tb.sections[0].lessonIds).not.toContain(PS);

    data = d.moveSection(data, "tb_ef_elementary", "sec_efe_2", -1, T1);
    tb = data.textbooks.find((t) => t.id === "tb_ef_elementary")!;
    expect(tb.sections.map((s) => [s.id, s.order])).toEqual([
      ["sec_efe_2", 0], ["sec_efe_1", 1],
    ]);
  });

  it("a duplicated textbook is an independent global copy without learner versions", () => {
    let data = createDemoData();
    const r = d.duplicateTextbook(data, "tb_ef_elementary", T1);
    data = r.data;
    const copy = data.textbooks.find((t) => t.id === r.textbookId)!;
    expect(copy.title).toBe("English File Elementary (копия)");
    const copyLessonIds = copy.sections.flatMap((s) => s.lessonIds);
    expect(copyLessonIds).toHaveLength(5);
    expect(copyLessonIds).not.toContain(PS);
    expect(copyLessonIds.some((id) => d.lessonHasLearnerActivity(data, id))).toBe(false);
  });

  it("creates a lesson inside a textbook section", () => {
    const r = d.createLesson(
      createDemoData(), "Новый урок", { textbookId: "tb_ef_elementary", sectionId: "sec_efe_2" }, T1,
    );
    const tb = r.data.textbooks.find((t) => t.id === "tb_ef_elementary")!;
    expect(tb.sections[1].lessonIds.at(-1)).toBe(r.lessonId);
  });
});

describe("library queries", () => {
  it("lists one location: subfolders, textbooks, standalone lessons only", () => {
    const loc = d.libraryLocation(createDemoData(), "fld_grammar");
    expect(loc.textbooks.map((t) => t.id)).toEqual(["tb_grammar_a2"]);
    expect(loc.lessons.every((l) => l.folderId === "fld_grammar" && l.textbookId === null)).toBe(true);
    expect(loc.lessons.map((l) => l.id)).toContain("les_conditionals");
    const root = d.libraryLocation(createDemoData(), null);
    expect(root.folders).toHaveLength(5);
    expect(root.lessons.every((l) => l.textbookId === null && l.folderId === null)).toBe(true);
  });

  it("builds a folder path from the root", () => {
    let data = createDemoData();
    const sub = d.createFolder(data, "Подпапка", "fld_grammar");
    data = sub.data;
    expect(d.folderPath(data, sub.folderId).map((f) => f.name)).toEqual(["Грамматика", "Подпапка"]);
    expect(d.folderPath(data, null)).toEqual([]);
  });

  it("explains a blocked delete without changing data", () => {
    const data = createDemoData();
    expect(d.deleteBlockReason(data, "folder", "fld_publishers")).toBeNull();
    expect(d.deleteBlockReason(data, "lesson", PS)).toBe("has_learner_activity");
    expect(d.deleteBlockReason(data, "lesson", "les_weather")).toBeNull();
  });
});

describe("search", () => {
  it("finds materials in every folder as one flat list", () => {
    const r = d.searchMaterials(createDemoData(), "  CONDITIONAL ");
    expect(r.lessons.map((l) => l.id)).toEqual(["les_second_conditional", "les_conditionals"]);
    expect(r.lessons.every((l) => l.folderId === "fld_grammar")).toBe(true);
    expect(d.searchMaterials(createDemoData(), "english file").textbooks).toHaveLength(3);
  });

  it("skips lessons inside textbooks", () => {
    expect(d.searchMaterials(createDemoData(), "Present Simple").lessons).toEqual([]);
  });
});

describe("groups", () => {
  it("adds students to a group, skipping existing members and non-students", () => {
    const data = d.addGroupMembers(createDemoData(), "group_a2", ["anna", "irina", "group_b1", "nobody"]);
    const group = data.learners.find((l) => l.id === "group_a2")!;
    expect(group.memberIds).toEqual(["irina", "timur", "vera", "artem", "anna"]);
    expect(groupsOf(data, "anna").map((g) => g.id)).toEqual(["group_a2"]);
  });
});

describe("removing from a group", () => {
  it("removes only the membership", () => {
    const before = createDemoData();
    const data = d.removeGroupMember(before, "group_b1", "kseniya");
    expect(data.learners.find((l) => l.id === "group_b1")!.memberIds).not.toContain("kseniya");
    expect(groupsOf(data, "kseniya")).toEqual([]);
    expect(data.learners).toHaveLength(before.learners.length);
    expect(d.removeGroupMember(data, "group_b1", "kseniya")).toBe(data);
  });
});

describe("demo data integrity", () => {
  const data = createDemoData();

  it("meets spec §14 minimums", () => {
    expect(data.folders.length).toBeGreaterThanOrEqual(3);
    expect(data.textbooks.length).toBeGreaterThanOrEqual(5);
    expect(data.lessons.filter((l) => !l.textbookId).length).toBeGreaterThanOrEqual(8);
  });

  it("has a realistic library: 30 textbooks and standalone lessons", () => {
    expect(data.textbooks.length + data.lessons.filter((l) => !l.textbookId).length).toBe(30);
  });

  it("long-time learners have 20+ lessons in their history", () => {
    for (const id of ["anna", "maxim", "group_b1"]) {
      const history = d.getLessonHistory(data, id);
      expect(history.length).toBeGreaterThan(20);
      expect(new Set(history.map((h) => h.homework))).toEqual(new Set([null, "assigned", "completed", "reviewed"]));
    }
  });

  it("every group member is a student with their own profile", () => {
    for (const g of data.learners.filter((l) => l.type === "group")) {
      expect(g.memberIds?.length).toBeGreaterThan(0);
      for (const id of g.memberIds!) {
        expect(data.learners.find((l) => l.id === id)?.type).toBe("individual");
      }
    }
    expect(groupsOf(data, "kseniya").map((g) => g.id)).toEqual(["group_b1"]);
  });

  it("ids are unique", () => {
    for (const list of [data.lessons, data.learnerLessons, data.sessions, data.homework]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
    }
  });

  it("every reference resolves", () => {
    const lessonIds = new Set(data.lessons.map((l) => l.id));
    for (const tb of data.textbooks) {
      for (const id of [...tb.looseLessonIds, ...tb.sections.flatMap((s) => s.lessonIds)]) {
        expect(lessonIds.has(id)).toBe(true);
        expect(data.lessons.find((l) => l.id === id)!.textbookId).toBe(tb.id);
      }
    }
    for (const ll of data.learnerLessons) expect(lessonIds.has(ll.sourceLessonId)).toBe(true);
    const llIds = new Set(data.learnerLessons.map((ll) => ll.id));
    for (const s of data.sessions) expect(llIds.has(s.learnerLessonId)).toBe(true);
    for (const h of data.homework) expect(llIds.has(h.learnerLessonId)).toBe(true);
  });

  it("covers every homework status", () => {
    expect(new Set(data.homework.map((h) => h.status))).toEqual(
      new Set(["assigned", "completed", "reviewed"]),
    );
  });
});
