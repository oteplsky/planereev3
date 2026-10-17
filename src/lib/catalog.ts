// The public catalog: Planeree's own textbooks, the same for every teacher. Read-only and not persisted;
// «Добавить в библиотеку» copies a textbook into the teacher's library (see addTextbookFromCatalog).

import type { MaterialMeta } from "./meta";
import type { AccentColor, Author, Lesson, Textbook } from "./types";
import type { Materials } from "./domain";

export const PLANEREE: Author = { id: "planeree", name: "Planeree" };

const PUBLISHED = "2026-09-15T10:00:00.000Z";

/** [title, theory, exercise title, task] — a short two-block lesson. */
type LessonSpec = [title: string, theory: string, exerciseTitle: string, task: string];

interface TextbookSpec {
  id: string;
  title: string;
  description: string;
  meta: MaterialMeta;
  cover: AccentColor;
  /** Without sections: one list of lessons. With sections: [section title, lessons][]. */
  lessons?: LessonSpec[];
  sections?: [string, LessonSpec[]][];
}

const meta = (subject: MaterialMeta["subject"], ageGroup: MaterialMeta["ageGroup"], level: MaterialMeta["level"], customSubject = ""): MaterialMeta => ({
  subject,
  customSubject,
  ageGroup,
  level,
});

const specs: TextbookSpec[] = [
  {
    id: "cat_phrasal",
    title: "Phrasal Verbs in Context",
    description: "Фразовые глаголы по темам: путешествия, работа, отношения, быт.",
    meta: meta("english", "teens", "b2"),
    cover: "blue",
    lessons: [
      ["Phrasal Verbs: Travel", "set off, check in, get away, look around", "Отпуск", "Расскажите о поездке, используя 4 фразовых глагола."],
      ["Phrasal Verbs: Work", "carry out, deal with, take on, set up", "Задачи", "Опишите проект, используя фразовые глаголы."],
      ["Phrasal Verbs: Relationships", "get along, break up, look up to, ask out", "Сериал", "Перескажите сюжет любимого сериала."],
      ["Phrasal Verbs: Everyday Life", "wake up, turn off, run out of, tidy up", "Утро", "Опишите своё утро."],
    ],
  },
  {
    id: "cat_speaking_club",
    title: "Speaking Club B1",
    description: "Готовые темы для разговорной практики: вопросы для обсуждения и полезные фразы.",
    meta: meta("english", "adults", "b1"),
    cover: "coral",
    sections: [
      ["Unit 1 — Lifestyle", [
        ["Work-Life Balance", "burn out, unwind, a nine-to-five, flexible hours", "Обсуждение", "Как вы отдыхаете после работы? Три аргумента."],
        ["Healthy Habits", "work out, cut down on, give up, a balanced diet", "Мои привычки", "Какую привычку вы хотели бы завести и почему?"],
      ]],
      ["Unit 2 — Society", [
        ["Social Media", "scroll, post, go viral, screen time", "За и против", "Соцсети больше помогают или мешают?"],
        ["Living in a Big City", "commute, rent, crowded, vibrant", "Город или деревня", "Где вы хотели бы жить через 10 лет?"],
        ["Travel and Tourism", "off the beaten track, a tourist trap, sightseeing", "Лучшая поездка", "Расскажите о поездке, которую помните лучше всего."],
      ]],
    ],
  },
  {
    id: "cat_business_emails",
    title: "Business Emails",
    description: "Структура и фразы деловых писем: от запроса до жалобы.",
    meta: meta("english", "adults", "b2"),
    cover: "teal",
    lessons: [
      ["Opening and Closing", "I am writing to… / Looking forward to hearing from you.", "Начало и конец", "Напишите первое и последнее предложение письма клиенту."],
      ["Making Requests", "Could you possibly…? I would be grateful if…", "Просьба", "Попросите коллегу прислать отчёт до пятницы."],
      ["Complaints", "I am writing to express my dissatisfaction with…", "Жалоба", "Пожалуйтесь на задержку поставки."],
      ["Follow-ups", "Just following up on… / As discussed…", "Напоминание", "Напомните о встрече, на которую не ответили."],
    ],
  },
  {
    id: "cat_first_steps",
    title: "First Steps in English",
    description: "Первые слова и фразы для детей: игры, песни, карточки.",
    meta: meta("english", "kids", "pre_a1"),
    cover: "yellow",
    lessons: [
      ["Hello!", "Hello! Goodbye! What's your name? I'm…", "Знакомство", "Поздоровайтесь с игрушкой и назовите своё имя."],
      ["Colours", "red, blue, yellow, green, pink", "Раскраска", "Раскрасьте шарики по команде учителя."],
      ["Numbers 1–10", "one, two, three… ten", "Посчитай", "Сколько яблок на картинке?"],
      ["My Family", "mum, dad, sister, brother, grandma", "Моя семья", "Покажите фото и назовите, кто это."],
      ["Animals", "cat, dog, bird, fish, rabbit", "Кто это?", "Угадайте животное по звуку."],
    ],
  },
  {
    id: "cat_oge_speaking",
    title: "ОГЭ: устная часть",
    description: "Все задания устной части ОГЭ по английскому с примерами ответов.",
    meta: meta("english_school", "teens", "grade_9"),
    cover: "violet",
    lessons: [
      ["Задание 1. Чтение вслух", "Интонация, паузы, сложные слова.", "Прочитайте текст", "Прочитайте научно-популярный текст за 1,5 минуты."],
      ["Задание 2. Условный диалог-расспрос", "Полные ответы, 2–3 предложения на вопрос.", "Ответьте на вопросы", "Ответьте на 6 вопросов телефонного опроса."],
      ["Задание 3. Монолог", "План: вступление, три пункта, вывод.", "Монолог", "Расскажите о любимом виде спорта по плану."],
    ],
  },
  {
    id: "cat_fractions",
    title: "Дроби: 5 класс",
    description: "Обыкновенные дроби с наглядными заданиями и проверочными работами.",
    meta: meta("math", "kids", "grade_5"),
    cover: "green",
    lessons: [
      ["Что такое дробь", "Числитель показывает, сколько частей взяли; знаменатель — на сколько частей разделили.", "Закрасьте", "Закрасьте 3/8 круга."],
      ["Сравнение дробей", "При одинаковых знаменателях больше та дробь, у которой больше числитель.", "Сравните", "2/7 и 5/7; 3/4 и 3/5"],
      ["Сложение и вычитание", "a/c + b/c = (a + b)/c", "Посчитайте", "1/9 + 4/9; 7/10 − 3/10"],
      ["Смешанные числа", "2 1/3 = 7/3", "Переведите", "Запишите 3 2/5 неправильной дробью."],
    ],
  },
  {
    id: "cat_spelling_6",
    title: "Орфография: 6 класс",
    description: "Правописание приставок, суффиксов и НЕ с разными частями речи.",
    meta: meta("russian_school", "teens", "grade_6"),
    cover: "pink",
    sections: [
      ["Приставки", [
        ["ПРЕ- и ПРИ-", "ПРИ- — приближение, неполнота действия; ПРЕ- — «очень», «пере-».", "Вставьте букву", "пр_брежный, пр_красный, пр_ехать"],
        ["Ы и И после приставок", "После приставок на согласный пишем Ы: безыдейный.", "Вставьте букву", "без_нтересный, раз_грать, сверх_нтересный"],
      ]],
      ["Части речи", [
        ["НЕ с существительными", "Слитно, если без НЕ не употребляется: неряха.", "Слитно или раздельно", "(не)вежда, (не)правда, а ложь"],
        ["НЕ с прилагательными", "Слитно, если можно заменить синонимом без НЕ.", "Слитно или раздельно", "(не)большой дом, (не)высокий, а низкий"],
      ]],
    ],
  },
  {
    id: "cat_spanish_a1",
    title: "Испанский с нуля",
    description: "Базовый курс для взрослых: знакомство, покупки, город.",
    meta: meta("other_language", "adults", "a1", "Испанский"),
    cover: "orange",
    lessons: [
      ["¡Hola! Знакомство", "Hola, me llamo… ¿Cómo te llamas? Mucho gusto.", "Представьтесь", "Расскажите о себе: имя, город, профессия."],
      ["Ser и estar", "Soy profesora. Estoy cansada.", "Выберите глагол", "Madrid ___ en España. Yo ___ de Rusia."],
      ["En el café", "Un café con leche, por favor. ¿Cuánto es?", "Заказ", "Закажите завтрак на двоих."],
    ],
  },
];

function build(spec: TextbookSpec): { textbook: Textbook; lessons: Lesson[] } {
  let n = 0;
  const lessons: Lesson[] = [];
  const toLesson = ([title, theory, exerciseTitle, task]: LessonSpec): string => {
    const id = `${spec.id}_les${++n}`;
    lessons.push({
      id,
      title,
      textbookId: spec.id,
      folderId: null,
      content: {
        blocks: [
          { id: `${id}_1`, type: "text", title: "Теория", content: theory },
          { id: `${id}_2`, type: "exercise", title: `Упражнение 1. ${exerciseTitle}`, content: task },
        ],
      },
      cover: null,
      updatedAt: PUBLISHED,
    });
    return id;
  };

  const sections = (spec.sections ?? []).map(([title, items], order) => ({
    id: `${spec.id}_sec${order + 1}`,
    title,
    order,
    lessonIds: items.map(toLesson),
  }));
  const looseLessonIds = (spec.lessons ?? []).map(toLesson);

  return {
    textbook: {
      id: spec.id,
      title: spec.title,
      description: spec.description,
      meta: spec.meta,
      folderId: null,
      useSections: sections.length > 0,
      sections,
      looseLessonIds,
      cover: spec.cover,
      coverImage: null,
      author: PLANEREE,
      catalogSourceId: null,
      updatedAt: PUBLISHED,
    },
    lessons,
  };
}

const built = specs.map(build);

export const catalog: Materials = {
  textbooks: built.map((b) => b.textbook),
  lessons: built.flatMap((b) => b.lessons),
};
