import type { BlockReason } from "./types";

/** Teacher-facing explanations for refused actions. No technical copy/version terms. */
export const blockMessages: Record<BlockReason, { title: string; description: string }> = {
  folder_not_empty: {
    title: "В папке есть материалы",
    description: "Сначала перенесите или удалите всё, что в ней лежит, — потом папку можно будет удалить.",
  },
  has_learner_activity: {
    title: "С этим материалом уже занимались",
    description:
      "Его используют ваши ученики: в нём их уроки и домашние задания. Чтобы ничего не потерялось, удалить его нельзя.",
  },
  not_found: {
    title: "Материал не найден",
    description: "Похоже, его уже удалили. Обновите страницу.",
  },
};
