import { describe, expect, it } from "vitest";
import * as d from "./domain";
import { catalog, PLANEREE } from "./catalog";
import { createDemoData } from "./demo-data";
import { groupsOf } from "./learners";
import * as m from "./meta";
import type { AppData } from "./types";

const T1 = "2026-10-08T10:00:00.000Z";
const T2 = "2026-10-08T11:00:00.000Z";
const T3 = "2026-10-08T12:00:00.000Z";

const PS = "les_present_simple";
const NEW_TEXTBOOK: d.NewTextbook = {
  title: "Новый учебник",
  description: "",
  meta: { subject: "english", customSubject: "", ageGroup: "teens", level: "b1" },
};
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

  it("deletes materials learners worked with, keeping their copies under the title they knew", () => {
    const before = createDemoData();
    const title = before.lessons.find((l) => l.id === PS)!.title;
    const r = d.deleteLesson(before, PS);
    expect(r.ok).toBe(true);
    const data = r.ok ? r.data : before;
    expect(data.lessons.some((l) => l.id === PS)).toBe(false);
    expect(d.resolveLesson(data, PS, null)).toBeNull();
    const anna = d.resolveLesson(data, PS, "anna")!;
    expect(anna.lesson.title).toBe(title);
    expect(anna.content.blocks.length).toBeGreaterThan(0);
    expect(d.getLessonHistory(data, "anna").some((h) => h.lesson.id === PS && h.lesson.title === title)).toBe(true);
    expect(d.deleteTextbook(before, "tb_ef_elementary").ok).toBe(true);
    expect(d.deleteSection(before, "tb_ef_elementary", "sec_efe_1", T1).ok).toBe(true);
  });

  it("an adapted title stays the learner's, and the original's title brings it back to following", () => {
    let data = createDemoData();
    const content = d.resolveLesson(data, PS, "anna")!.content;
    data = d.updateLearnerLessonContent(data, "anna", PS, content, T1, "Present Simple для Анны");
    expect(d.resolveLesson(data, PS, "anna")!.lesson.title).toBe("Present Simple для Анны");
    const original = d.resolveLesson(data, PS, null)!.lesson;
    expect(original.title).not.toBe("Present Simple для Анны");
    expect(d.lessonTitleFor(data, original, "anna")).toBe("Present Simple для Анны");
    expect(d.lessonTitleFor(data, original, "maxim")).toBe(original.title);
    data = d.updateLearnerLessonContent(data, "anna", PS, content, T2, original.title);
    expect(d.findLearnerLesson(data, "anna", PS)!.title).toBeNull();
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
    expect(d.deleteBlockReason(data, "lesson", PS)).toBeNull();
    expect(d.deleteBlockReason(data, "lesson", "nobody")).toBe("not_found");
  });
});

describe("library order", () => {
  const keys = (data: AppData, folderId: string | null) =>
    d.libraryLocation(data, folderId).materials.map((m) => m.item.id);

  it("puts new, duplicated and moved materials first", () => {
    let data = createDemoData();
    const tb = d.createTextbook(data, NEW_TEXTBOOK, null, T1);
    data = tb.data;
    expect(keys(data, null)[0]).toBe(tb.textbookId);
    const lesson = d.createLesson(data, "Новый урок", { folderId: null }, T2);
    data = lesson.data;
    expect(keys(data, null).slice(0, 2)).toEqual([lesson.lessonId, tb.textbookId]);
    data = d.moveMaterial(data, "lesson", "les_conditionals", null);
    expect(keys(data, null)[0]).toBe("les_conditionals");
    const copy = d.duplicateTextbook(data, tb.textbookId, T3);
    expect(keys(copy.data, null)[0]).toBe(copy.textbookId);
  });

  it("keeps a dragged order, textbooks and lessons mixed", () => {
    const data = createDemoData();
    const order = d.libraryLocation(data, "fld_grammar").materials.map((m) => ({ kind: m.kind, id: m.item.id })).reverse();
    const next = d.reorderMaterials(data, order);
    expect(keys(next, "fld_grammar")).toEqual(order.map((o) => o.id));
    // Editing doesn't reshuffle it.
    expect(keys(d.renameMaterial(next, order[1].kind, order[1].id, "Другое", T3), "fld_grammar")).toEqual(order.map((o) => o.id));
  });
});

describe("shared textbooks", () => {
  it("saves an independent copy at the top of the root, credited to the sender", () => {
    let data = createDemoData();
    data = d.moveMaterial(data, "textbook", "tb_grammar_a2", "fld_grammar");
    const r = d.saveSharedTextbook(data, "tb_grammar_a2", T1);
    const copy = r.data.textbooks.find((t) => t.id === r.textbookId)!;
    expect(copy.sharedSourceId).toBe("tb_grammar_a2");
    expect(copy.folderId).toBeNull();
    expect(copy.author).toEqual(d.sharedAuthor(data, data.textbooks.find((t) => t.id === "tb_grammar_a2")!));
    expect(d.libraryLocation(r.data, null).materials[0].item.id).toBe(copy.id);
    expect(d.textbookFromShare(r.data, "tb_grammar_a2")?.id).toBe(copy.id);
    expect(d.textbookLessonCount(copy)).toBe(d.textbookLessonCount(data.textbooks.find((t) => t.id === "tb_grammar_a2")!));
    expect(r.data.lessons.filter((l) => l.textbookId === copy.id).every((l) => !data.lessons.some((o) => o.id === l.id))).toBe(true);
  });
});

describe("shared lessons", () => {
  it("saves a textbook lesson as a standalone copy credited to the textbook's author", () => {
    const data = createDemoData();
    const r = d.saveSharedLesson(data, PS, T1);
    const copy = r.data.lessons.find((l) => l.id === r.lessonId)!;
    expect(copy).toMatchObject({ textbookId: null, folderId: null, sharedSourceId: PS });
    expect(d.materialAuthor(r.data, copy)).toEqual(d.sharedLessonAuthor(data, data.lessons.find((l) => l.id === PS)!));
    expect(d.libraryLocation(r.data, null).materials[0].item.id).toBe(copy.id);
    expect(d.lessonFromShare(r.data, PS)?.id).toBe(copy.id);
    expect(d.libraryAuthors(r.data).some((a) => a.id === copy.author!.id)).toBe(true);
  });
});

describe("someone else's lessons", () => {
  const withCatalogTextbook = () => {
    const r = d.addTextbookFromCatalog(createDemoData(), catalog, "cat_speaking_club", T1);
    const tb = r.data.textbooks.find((t) => t.id === r.textbookId)!;
    const lessonId = r.data.lessons.find((l) => l.textbookId === tb.id)!.id;
    return { data: r.data, tb, lessonId };
  };
  const author = (data: AppData, lessonId: string) => d.materialAuthor(data, data.lessons.find((l) => l.id === lessonId)!);

  it("keep their author when moved to an own textbook or out of the textbook", () => {
    const { data, lessonId } = withCatalogTextbook();
    const own = d.createTextbook(data, NEW_TEXTBOOK, null, T1);
    const moved = d.moveLessonToTextbook(own.data, lessonId, own.textbookId, null, T2);
    expect(moved.lessons.find((l) => l.id === lessonId)!.textbookId).toBe(own.textbookId);
    expect(author(moved, lessonId)).toEqual(PLANEREE);
    expect(author(d.removeLessonFromTextbook(data, lessonId, T2), lessonId)).toEqual(PLANEREE);
  });

  it("an own lesson moved into a catalog copy stays the teacher's", () => {
    const { data, tb } = withCatalogTextbook();
    const own = d.createLesson(data, "Мой урок", { folderId: null }, T1);
    const target = tb.useSections ? tb.sections[0].id : null;
    const next = d.moveLessonToTextbook(own.data, own.lessonId, tb.id, target, T2);
    expect(next.lessons.find((l) => l.id === own.lessonId)!.textbookId).toBe(tb.id);
    expect(author(next, own.lessonId)).toBeNull();
  });

  it("needs a section exactly when the textbook has sections", () => {
    const { data, tb } = withCatalogTextbook();
    const own = d.createLesson(data, "Мой урок", { folderId: null }, T1);
    const wrong = tb.useSections ? null : "sec_nope";
    expect(d.moveLessonToTextbook(own.data, own.lessonId, tb.id, wrong, T2)).toBe(own.data);
  });

  it("can't be shared, nor can an own textbook that has them", () => {
    const { data, tb, lessonId } = withCatalogTextbook();
    expect(d.shareStatus(data, "textbook", tb.id)).toBe("foreign");
    expect(d.shareStatus(data, "lesson", lessonId)).toBe("foreign");
    const own = d.createTextbook(data, NEW_TEXTBOOK, null, T1);
    expect(d.shareStatus(own.data, "textbook", own.textbookId)).toBe("own");
    const mixed = d.moveLessonToTextbook(own.data, lessonId, own.textbookId, null, T2);
    expect(d.shareStatus(mixed, "textbook", own.textbookId)).toBe("mixed");
    expect(d.shareStatus(mixed, "lesson", lessonId)).toBe("foreign");
  });
});

describe("lesson numbers", () => {
  it("count within each section, or straight through without sections", () => {
    let data = createDemoData();
    let tb = d.createTextbook(data, NEW_TEXTBOOK, null, T1);
    data = d.setUseSections(tb.data, tb.textbookId, true, T1);
    data = d.addSection(data, tb.textbookId, "Unit 1", T1);
    data = d.addSection(data, tb.textbookId, "Unit 2", T1);
    const [s1, s2] = data.textbooks.find((t) => t.id === tb.textbookId)!.sections;
    for (const [title, sectionId] of [["a", s1.id], ["b", s1.id], ["c", s2.id]] as const) {
      data = d.createLesson(data, title, { textbookId: tb.textbookId, sectionId }, T2).data;
    }
    const byTitle = (data: AppData, id: string) => {
      const numbers = d.lessonNumbers(data, data.textbooks.find((t) => t.id === id)!);
      return Object.fromEntries(data.lessons.filter((l) => numbers.has(l.id)).map((l) => [l.title, numbers.get(l.id)]));
    };
    expect(byTitle(data, tb.textbookId)).toEqual({ a: "1.1", b: "1.2", c: "2.1" });

    tb = d.createTextbook(data, NEW_TEXTBOOK, null, T1);
    data = tb.data;
    for (const title of ["x", "y"]) data = d.createLesson(data, title, { textbookId: tb.textbookId }, T2).data;
    expect(byTitle(data, tb.textbookId)).toEqual({ x: "1", y: "2" });
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

describe("textbook metadata", () => {
  it("offers only Дети, Подростки, Взрослые", () => {
    expect(m.AGE_GROUPS.map((a) => m.ageGroupLabels[a])).toEqual(["Дети", "Подростки", "Взрослые"]);
  });

  it("offers the same CEFR list at every age for English and other foreign languages", () => {
    for (const subject of ["english", "other_language"] as const) {
      for (const age of m.AGE_GROUPS) {
        expect(m.levelsFor(subject, age).map((l) => m.levelLabels[l])).toEqual(["Pre-A1", "A1", "A2", "B1", "B2", "C1", "C2", "Другое"]);
      }
    }
    expect(m.levelsFor("english", null)).toEqual([]);
  });

  it("offers school stages by age for school and other subjects", () => {
    for (const subject of ["english_school", "math", "russian_school", "other"] as const) {
      expect(m.levelsFor(subject, "kids").map((l) => m.levelLabels[l])).toEqual([
        "Дошкольное образование", "1 класс", "2 класс", "3 класс", "4 класс", "5 класс", "6 класс", "Другое",
      ]);
      expect(m.levelsFor(subject, "teens").map((l) => m.levelLabels[l])).toEqual([
        "5 класс", "6 класс", "7 класс", "8 класс", "9 класс", "10 класс", "11 класс", "Другое",
      ]);
      expect(m.levelsFor(subject, "adults")).toEqual(["other"]);
    }
  });

  it("maps saved «Дошкольники» to «Дети» and clears levels that no longer exist", () => {
    const legacy = (meta: object) => m.migrateMeta(meta as m.MaterialMeta);
    expect(legacy({ subject: "other", customSubject: "Рисование", ageGroup: "preschool", level: "preschool_ed" }))
      .toMatchObject({ ageGroup: "kids", level: "preschool_ed" });
    expect(legacy({ subject: "other", customSubject: "Охрана труда", ageGroup: "adults", level: "dpo" }))
      .toMatchObject({ ageGroup: "adults", level: null });
    expect(legacy({ subject: "english", customSubject: "", ageGroup: "preschool", level: "pre_a1" }))
      .toMatchObject({ ageGroup: "kids", level: "pre_a1" });

    const data = createDemoData();
    const tb = data.textbooks[0];
    tb.meta = { ...tb.meta, ageGroup: "preschool" as m.AgeGroup };
    expect(d.migrateData(data).textbooks[0].meta.ageGroup).toBe("kids");
  });

  it("clears a level only when it stops being valid", () => {
    const b1: m.MaterialMeta = { subject: "english", customSubject: "", ageGroup: "teens", level: "b1" };
    expect(m.normalizeMeta({ ...b1, ageGroup: "adults" }).level).toBe("b1");
    expect(m.normalizeMeta({ ...b1, subject: "other" }).level).toBeNull();
    const grade: m.MaterialMeta = { subject: "other", customSubject: "История", ageGroup: "kids", level: "grade_5" };
    expect(m.normalizeMeta({ ...grade, ageGroup: "teens" }).level).toBe("grade_5");
    expect(m.normalizeMeta({ ...grade, level: "grade_2", ageGroup: "teens" }).level).toBeNull();
    expect(m.normalizeMeta({ ...grade, ageGroup: "adults" }).level).toBeNull();
    expect(m.normalizeMeta({ ...grade, level: "other", ageGroup: "adults" }).level).toBe("other");
    expect(m.normalizeMeta({ ...grade, level: "other", subject: "english" })).toMatchObject({ level: "other", customSubject: "" });
  });

  it("uses CEFR for English and other foreign languages, and grades for school subjects", () => {
    const cefr = m.levelsFor("english", "kids");
    expect(m.levelsFor("other_language", "teens")).toEqual(cefr);
    for (const subject of ["english_school", "math", "russian_school", "other"] as const) {
      expect(m.levelsFor(subject, "kids")).toContain("grade_5");
      expect(m.levelsFor(subject, "kids")).not.toContain("b1");
    }
  });

  it("asks for the name only for «Другой иностранный язык» and «Другой предмет»", () => {
    const base: m.MaterialMeta = { subject: "math", customSubject: "", ageGroup: "teens", level: "grade_9" };
    expect(m.isMetaComplete(base)).toBe(true);
    expect(m.isMetaComplete({ ...base, subject: "other_language", level: "a2" })).toBe(false);
    const german = { ...base, subject: "other_language" as const, customSubject: "Немецкий", level: "a2" as const };
    expect(m.isMetaComplete(german)).toBe(true);
    expect(m.metaSummary(german)).toBe("Немецкий · Подростки · A2");
    expect(m.normalizeMeta({ ...german, subject: "english_school" })).toMatchObject({ customSubject: "", level: null });
  });

  it("requires a custom subject for «Другой предмет»", () => {
    const meta: m.MaterialMeta = { subject: "other", customSubject: " ", ageGroup: "adults", level: "other" };
    expect(m.isMetaComplete(meta)).toBe(false);
    expect(m.isMetaComplete({ ...meta, customSubject: "Пожарная безопасность" })).toBe(true);
    expect(m.isMetaComplete({ ...meta, customSubject: "Охрана труда", level: null })).toBe(false);
  });

  it("creates a textbook without sections and edits its details", () => {
    const r = d.createTextbook(createDemoData(), { ...NEW_TEXTBOOK, title: "  Физика 7  ", description: " " }, null, T1);
    let tb = r.data.textbooks.find((t) => t.id === r.textbookId)!;
    expect(tb).toMatchObject({ title: "Физика 7", description: "", useSections: false, coverImage: null });

    let data = d.updateTextbookDetails(r.data, tb.id, { title: "  " }, T2);
    expect(data.textbooks.find((t) => t.id === tb.id)!.title).toBe("Физика 7");
    data = d.updateTextbookDetails(data, tb.id, { meta: { ...tb.meta, subject: "other" } }, T2);
    tb = data.textbooks.find((t) => t.id === tb.id)!;
    expect(tb.meta.level).toBeNull();

    data = d.setTextbookCoverImage(data, tb.id, "data:image/jpeg;base64,AAA", T2);
    expect(data.textbooks.find((t) => t.id === tb.id)!.coverImage).toBe("data:image/jpeg;base64,AAA");
    data = d.setTextbookCoverImage(data, "tb_business", null, T2);
    expect(data.textbooks.find((t) => t.id === "tb_business")).toMatchObject({ cover: null, coverImage: null });
  });

  it("locks the structure once the textbook has a lesson", () => {
    const r = d.createTextbook(createDemoData(), NEW_TEXTBOOK, null, T1);
    let data = d.setUseSections(r.data, r.textbookId, true, T1);
    data = d.addSection(data, r.textbookId, "Unit 1", T1);
    data = d.setUseSections(data, r.textbookId, false, T1);
    expect(data.textbooks.find((t) => t.id === r.textbookId)!.useSections).toBe(false);

    data = d.setUseSections(data, r.textbookId, true, T1);
    const sectionId = data.textbooks.find((t) => t.id === r.textbookId)!.sections[0].id;
    data = d.createLesson(data, "Урок 1", { textbookId: r.textbookId, sectionId }, T1).data;
    expect(d.setUseSections(data, r.textbookId, false, T1)).toBe(data);
  });

  it("moves a section with its lessons to any position", () => {
    const data = d.moveSectionTo(createDemoData(), "tb_ef_intermediate", "sec_efi_3", 0, T1);
    const { sections } = d.textbookLessons(data, data.textbooks.find((t) => t.id === "tb_ef_intermediate")!);
    expect(sections.map((s) => s.section.id)).toEqual(["sec_efi_3", "sec_efi_1", "sec_efi_2"]);
    expect(sections[0].lessons.map((l) => l.id)).toEqual(["les_transport", "les_used_to"]);
  });

  it("moving a lesson between sections never copies it", () => {
    const before = createDemoData();
    const data = d.moveLessonInTextbook(before, "tb_ef_intermediate", "les_used_to", "sec_efi_1", T1, 1);
    expect(data.lessons).toHaveLength(before.lessons.length);
    const tb = data.textbooks.find((t) => t.id === "tb_ef_intermediate")!;
    expect(tb.sections.flatMap((s) => s.lessonIds).filter((id) => id === "les_used_to")).toHaveLength(1);
    expect(tb.sections[0].lessonIds).toEqual(["les_present_tenses_review", "les_used_to", "les_future_forms"]);
  });
});

describe("library filters", () => {
  const data = createDemoData();
  const ids = (r: ReturnType<typeof d.searchMaterials>) => [...r.textbooks, ...r.lessons].map((x) => x.id);

  it("combines filters with each other and with the query (AND), across folders", () => {
    const teensB1 = { subject: "english", ageGroup: "teens", level: "b1" } as const;
    expect(ids(d.searchMaterials(data, "", teensB1))).toEqual(["tb_vocab_b1"]);
    expect(data.textbooks.find((t) => t.id === "tb_vocab_b1")!.folderId).toBe("fld_vocabulary");
    expect(ids(d.searchMaterials(data, "vocabulary", teensB1))).toEqual(["tb_vocab_b1"]);
    expect(ids(d.searchMaterials(data, "grammar", teensB1))).toEqual([]);
    expect(ids(d.searchMaterials(data, "", { ...m.noFilters, level: "b1" })).sort()).toEqual(
      ["tb_business", "tb_ef_intermediate", "tb_speakout", "tb_vocab_b1"],
    );
  });

  it("keeps materials without metadata only while no filter is set", () => {
    expect(d.searchMaterials(data, "passive").lessons.map((l) => l.id)).toEqual(["les_passive_voice"]);
    expect(d.searchMaterials(data, "passive", { ...m.noFilters, subject: "english" }).lessons).toEqual([]);
  });

  it("textbook lessons inherit their textbook's metadata", () => {
    const lesson = data.lessons.find((l) => l.id === PS)!;
    expect(d.materialMeta(data, lesson)).toEqual(data.textbooks.find((t) => t.id === "tb_ef_elementary")!.meta);
  });

  it("offers only levels that materials have, within the selected subject and age group", () => {
    expect(d.filterLevelOptions(data, m.noFilters)).toEqual(["a1", "a2", "b1", "b2", "c1"]);
    expect(d.filterLevelOptions(data, { ...m.noFilters, ageGroup: "teens" })).toEqual(["a2", "b1", "b2"]);
    expect(d.filterLevelOptions(data, { ...m.noFilters, ageGroup: "kids" })).toEqual([]);
    expect(d.filterLevelOptions(data, { ...m.noFilters, ageGroup: "teens", level: "b2" })).toContain("b1");
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

describe("catalog", () => {
  const SPEAKING = "cat_speaking_club";

  it("adding a catalog textbook gives the teacher their own copy at the library root", () => {
    const data = createDemoData();
    const r = d.addTextbookFromCatalog(data, catalog, SPEAKING, T1);
    const source = catalog.textbooks.find((t) => t.id === SPEAKING)!;
    const copy = r.data.textbooks.find((t) => t.id === r.textbookId)!;
    expect(copy.id).not.toBe(SPEAKING);
    expect(copy.title).toBe(source.title);
    expect(copy.author).toEqual(PLANEREE);
    expect(copy.catalogSourceId).toBe(SPEAKING);
    expect(copy.folderId).toBeNull();
    expect(d.textbookFromCatalog(r.data, SPEAKING)?.id).toBe(copy.id);

    const copied = r.data.lessons.filter((l) => l.textbookId === copy.id);
    expect(copied).toHaveLength(d.textbookLessonCount(source));
    expect(copied.every((l) => !l.id.startsWith(SPEAKING))).toBe(true);
    expect(copy.sections.flatMap((s) => s.lessonIds).sort()).toEqual(copied.map((l) => l.id).sort());
  });

  it("the copy is independent of the catalog", () => {
    const r = d.addTextbookFromCatalog(createDemoData(), catalog, SPEAKING, T1);
    const lessonId = r.data.lessons.find((l) => l.textbookId === r.textbookId)!.id;
    const edited = d.updateGlobalLessonContent(r.data, lessonId, { blocks: [] }, T2);
    const catalogLesson = catalog.lessons.find((l) => l.textbookId === SPEAKING)!;
    expect(catalogLesson.content.blocks.length).toBeGreaterThan(0);
    expect(edited.lessons.find((l) => l.id === lessonId)!.content.blocks).toHaveLength(0);
  });

  it("an unknown catalog textbook changes nothing", () => {
    const data = createDemoData();
    const r = d.addTextbookFromCatalog(data, catalog, "cat_missing", T1);
    expect(r.textbookId).toBeNull();
    expect(r.data).toBe(data);
  });

  it("every catalog textbook is Planeree's and its lessons exist", () => {
    for (const t of catalog.textbooks) {
      expect(t.author).toEqual(PLANEREE);
      expect(m.isMetaComplete(t.meta)).toBe(true);
      const { sections, loose } = d.textbookLessons(catalog, t);
      expect([...sections.flatMap((s) => s.lessons), ...loose]).toHaveLength(d.textbookLessonCount(t));
    }
  });

  it("demo materials from the catalog point at a real catalog textbook", () => {
    for (const t of createDemoData().textbooks.filter((t) => t.catalogSourceId)) {
      expect(catalog.textbooks.some((c) => c.id === t.catalogSourceId)).toBe(true);
    }
  });
});

describe("source filter", () => {
  it("separates the teacher's materials from other authors'", () => {
    const data = createDemoData();
    const planeree = d.searchMaterials(data, "", m.noFilters, PLANEREE.id);
    const mine = d.searchMaterials(data, "", m.noFilters, "mine");
    expect(planeree.textbooks.map((t) => t.id)).toEqual(["tb_phrasal"]);
    expect(planeree.lessons).toHaveLength(0);
    expect(mine.textbooks.some((t) => t.id === "tb_phrasal")).toBe(false);
    expect(mine.lessons.length).toBeGreaterThan(0);
    expect(d.libraryAuthors(data)).toEqual([PLANEREE]);
  });
});

describe("textbook progress for a learner", () => {
  // English File Elementary, in order: introductions, present simple, daily routines, past simple, my weekend.
  const EFE = "tb_ef_elementary";
  const fresh = (): AppData => {
    const data = createDemoData();
    const mine = new Set(data.learnerLessons.filter((ll) => ll.learnerId === "liza").map((ll) => ll.id));
    return {
      ...data,
      learnerLessons: data.learnerLessons.filter((ll) => !mine.has(ll.id)),
      sessions: data.sessions.filter((s) => !mine.has(s.learnerLessonId)),
      homework: data.homework.filter((h) => !mine.has(h.learnerLessonId)),
    };
  };
  const teach = (data: AppData, lessonId: string, at: string, finish = true) => {
    const r = d.startLesson(data, "liza", lessonId, at);
    return finish ? d.completeSession(r.data, r.session.id, at) : r.data;
  };
  const progress = (data: AppData) => d.textbookProgress(data, "liza", data.textbooks.find((t) => t.id === EFE)!);

  it("is null until the textbook is used with the learner", () => {
    expect(progress(fresh())).toBeNull();
    expect(d.learnerTextbooks(fresh(), "liza")).toHaveLength(0);
  });

  it("counts finished lessons", () => {
    let data = teach(fresh(), "les_introductions", T1);
    data = teach(data, "les_present_simple", T2);
    expect(progress(data)).toMatchObject({ total: 5, completed: 2 });
  });

  it("a lesson in progress is not counted as finished", () => {
    const data = teach(fresh(), "les_introductions", T1, false);
    expect(progress(data)).toMatchObject({ completed: 0 });
  });

  it("lists the learner's textbooks, most recently active first", () => {
    let data = teach(fresh(), "les_introductions", T1);
    data = teach(data, "les_present_continuous", T2);
    expect(d.learnerTextbooks(data, "liza").map((p) => p.textbook.id)).toEqual(["tb_ef_preint", EFE]);
  });
});

describe("library order in a learner context", () => {
  it("puts textbooks used with the learner first, most recent first", () => {
    const data = createDemoData();
    const used = d.learnerTextbooks(data, "maxim").map((p) => p.textbook.id);
    const sorted = d.sortByRecentUse(data, "maxim", data.textbooks).map((t) => t.id);
    expect(sorted.slice(0, used.length)).toEqual(used);
    expect(sorted).toHaveLength(data.textbooks.length);
  });
});
