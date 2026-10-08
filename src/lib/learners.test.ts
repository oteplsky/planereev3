import { describe, expect, it } from "vitest";
import { genitive, initials, learnerTypeLabel } from "./learners";
import type { Learner } from "./types";

const person = (name: string): Learner => ({ id: name, name, type: "individual", avatarColor: "blue" });
const group = (name: string, members: string[] = []): Learner => ({
  id: name, name, type: "group", avatarColor: "blue", members,
});

describe("genitive", () => {
  it.each([
    ["Анна Кузнецова", "Анны"],
    ["Максим Лебедев", "Максима"],
    ["София Ким", "Софии"],
    ["Паша", "Паши"],
    ["Елена Миронова", "Елены"],
    ["Дмитрий Орлов", "Дмитрия"],
    ["Ксения Белова", "Ксении"],
    ["Артём Власов", "Артёма"],
    ["Полина Зайцева", "Полины"],
    ["Ольга Петрова", "Ольги"],
    ["Игорь Смирнов", "Игоря"],
  ])("%s → %s", (name, expected) => {
    expect(genitive(person(name))).toBe(expected);
  });

  it("groups", () => {
    expect(genitive(group("Группа B1"))).toBe("группы B1");
  });
});

describe("labels", () => {
  it("initials", () => {
    expect(initials(person("Анна Кузнецова"))).toBe("АК");
    expect(initials(person("Паша"))).toBe("П");
    expect(initials(group("Группа A2"))).toBe("A2");
  });

  it("group type label with plural", () => {
    expect(learnerTypeLabel(group("Группа", ["a"]))).toBe("Группа · 1 участник");
    expect(learnerTypeLabel(group("Группа", ["a", "b", "c", "d"]))).toBe("Группа · 4 участника");
    expect(learnerTypeLabel(group("Группа", ["a", "b", "c", "d", "e"]))).toBe("Группа · 5 участников");
    expect(learnerTypeLabel(person("Анна"))).toBe("Ученик");
  });
});
