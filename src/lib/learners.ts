import { count, MEMBERS } from "./format";
import type { AccentColor, AppData, Learner } from "./types";

/** «Анна Кузнецова» → «АК», «Паша» → «П», «Группа B1» → «B1». */
export function initials(learner: Learner): string {
  const words = learner.name.trim().split(/\s+/);
  if (learner.type === "group") return words.at(-1)!.slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Short label under an avatar: first name for people, full name for groups. */
export function shortName(learner: Learner): string {
  return learner.type === "group" ? learner.name : learner.name.split(/\s+/)[0];
}

/** «Ученик» or «Группа · 4 участника». */
export function learnerTypeLabel(learner: Learner): string {
  if (learner.type === "individual") return "Ученик";
  return `Группа · ${count(learner.memberIds?.length ?? 0, MEMBERS)}`;
}

/** Groups the student belongs to. */
export function groupsOf(data: AppData, learnerId: string): Learner[] {
  return data.learners.filter((l) => l.type === "group" && l.memberIds?.includes(learnerId));
}

/** A group's students, in the group's order. */
export function membersOf(data: AppData, group: Learner): Learner[] {
  return (group.memberIds ?? []).flatMap((id) => data.learners.find((l) => l.id === id) ?? []);
}

/** Avatars use the "lighter" tone with black initials (UI kit · Данные). */
export const avatarBg: Record<AccentColor, string> = {
  pink: "bg-pink-lighter",
  coral: "bg-coral-lighter",
  orange: "bg-orange-lighter",
  yellow: "bg-yellow-lighter",
  green: "bg-green-lighter",
  teal: "bg-teal-lighter",
  blue: "bg-blue-lighter",
  violet: "bg-violet-lighter",
};

/**
 * Genitive of the learner's first name for phrases like «Версия для Анны».
 * Rule-based for common Russian first names; groups become «группы B1».
 */
export function genitive(learner: Learner): string {
  if (learner.type === "group") {
    return learner.name.replace(/^Группа/u, "группы");
  }
  const name = shortName(learner);
  const last = name.at(-1)!;
  const stem = name.slice(0, -1);
  if (last === "а") return stem + (/[гкхжчшщ]$/u.test(stem) ? "и" : "ы");
  if (last === "я") return stem + "и";
  if (last === "й" || last === "ь") return stem + "я";
  if (/[бвгджзклмнпрстфхцчшщ]/u.test(last)) return name + "а";
  return name; // indeclinable (e.g. ends in -о, -е, -и)
}

/** Dative first name: «к Анне», «к Максиму», «к группе B1». Same rules as `genitive`. */
export function dative(learner: Learner): string {
  if (learner.type === "group") {
    return learner.name.replace(/^Группа/u, "группе");
  }
  const name = shortName(learner);
  const last = name.at(-1)!;
  const stem = name.slice(0, -1);
  if (name.endsWith("ия")) return stem + "и";
  if (last === "а" || last === "я") return stem + "е";
  if (last === "й" || last === "ь") return stem + "ю";
  if (/[бвгджзклмнпрстфхцчшщ]/u.test(last)) return name + "у";
  return name;
}

/** «для Анны», «для группы B1». */
export const forLearner = (learner: Learner) => `для ${genitive(learner)}`;
