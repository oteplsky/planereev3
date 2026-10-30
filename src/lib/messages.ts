import type { BlockReason } from "./types";

/** Teacher-facing explanations for refused actions. No technical copy/version terms. */
export const blockMessages: Record<BlockReason, { title: string; description: string }> = {
  not_found: {
    title: "Материал не найден",
    description: "Похоже, его уже удалили. Обновите страницу.",
  },
};

/** Added to a delete confirmation when learners have worked with the material. */
export const KEPT_FOR_LEARNERS = "У учеников останутся их уроки и домашки.";

/** Why «Поделиться» is locked on an own textbook with someone else's lessons. */
