import type { AccentColor, Learner } from "./types";

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

const memberWord = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "участник";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "участника";
  return "участников";
};

/** «Ученик» or «Группа · 4 участника». */
export function learnerTypeLabel(learner: Learner): string {
  if (learner.type === "individual") return "Ученик";
  const n = learner.members?.length ?? 0;
  return `Группа · ${n} ${memberWord(n)}`;
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
