// Demo data (spec §14). Fixed ids keep tests and debugging readable.

import type {
  AccentColor,
  AppData,
  HomeworkAssignment,
  LearnerLesson,
  Lesson,
  LessonBlock,
  LessonSession,
  ShareLink,
  Textbook,
} from "./types";
import type { AgeGroup, Level } from "./meta";
import { PLANEREE } from "./catalog";

const at = (date: string, time = "10:00") => `${date}T${time}:00.000Z`;

const text = (id: string, title: string, content: string): LessonBlock => ({
  id,
  type: "text",
  title,
  content,
});
const exercise = (id: string, title: string, content: string): LessonBlock => ({
  id,
  type: "exercise",
  title,
  content,
});
const adapted = (block: LessonBlock): LessonBlock => ({ ...block, adapted: true });

function lesson(
  id: string,
  title: string,
  blocks: LessonBlock[],
  opts: { textbookId?: string; folderId?: string; cover?: AccentColor } = {},
): Lesson {
  return {
    id,
    title,
    textbookId: opts.textbookId ?? null,
    folderId: opts.textbookId ? null : (opts.folderId ?? null),
    content: { blocks },
    cover: opts.cover ?? null,
    updatedAt: at("2026-09-01"),
  };
}

// ───────────── Folders ─────────────

const folders = [
  { id: "fld_publishers", name: "Учебники издательств", parentFolderId: null },
  { id: "fld_grammar", name: "Грамматика", parentFolderId: null },
  { id: "fld_speaking", name: "Разговорная практика", parentFolderId: null },
  { id: "fld_vocabulary", name: "Лексика", parentFolderId: null },
  { id: "fld_exams", name: "Подготовка к экзаменам", parentFolderId: null },
];

/** [id, title, theory, exercise title, exercise] — a short two-block lesson. */
type LessonSpec = [id: string, title: string, theory: string, exerciseTitle: string, task: string];

function simpleLesson(
  [id, title, theory, exerciseTitle, task]: LessonSpec,
  opts: { textbookId?: string; folderId?: string; cover?: AccentColor } = {},
): Lesson {
  const key = id.replace(/^les_/, "");
  return lesson(id, title, [
    text(`blk_${key}_1`, "Теория", theory),
    exercise(`blk_${key}_2`, `Упражнение 1. ${exerciseTitle}`, task),
  ], opts);
}

// ───────────── Textbook lessons ─────────────

const efe = "tb_ef_elementary";
const efp = "tb_ef_preint";
const spk = "tb_speakout";
const bus = "tb_business";
const gpa = "tb_grammar_a2";

const textbookLessons: Lesson[] = [
  // English File Elementary
  lesson("les_introductions", "Introductions", [
    text("blk_intro_1", "Разминка", "Hi! My name is… Nice to meet you."),
    exercise("blk_intro_2", "Упражнение 1. Представьтесь", "Расскажите о себе в трёх предложениях."),
  ], { textbookId: efe }),
  lesson("les_present_simple", "Present Simple", [
    text("blk_ps_1", "Правило", "I work, she works. Do you work? She doesn't work."),
    exercise("blk_ps_2", "Упражнение 1. Вставьте глагол", "She ___ (live) in London. They ___ (play) tennis on Sundays."),
    exercise("blk_ps_3", "Упражнение 2. Вопросы", "Составьте вопросы: you / like / coffee?"),
  ], { textbookId: efe }),
  lesson("les_daily_routines", "Daily Routines", [
    text("blk_dr_1", "Лексика", "get up, have breakfast, go to work, get home"),
    exercise("blk_dr_2", "Упражнение 1. Мой день", "Опишите свой обычный день."),
  ], { textbookId: efe }),
  lesson("les_past_simple", "Past Simple", [
    text("blk_pas_1", "Правило", "I worked, I went. Did you go? I didn't go."),
    exercise("blk_pas_2", "Упражнение 1. Неправильные глаголы", "go → ___, see → ___, have → ___"),
  ], { textbookId: efe }),
  lesson("les_my_weekend", "My Weekend", [
    text("blk_mw_1", "Разговор", "What did you do last weekend?"),
    exercise("blk_mw_2", "Упражнение 1. Расскажите", "Три вещи, которые вы сделали в выходные."),
  ], { textbookId: efe }),

  // English File Pre-Intermediate
  lesson("les_present_continuous", "Present Continuous", [
    text("blk_pc_1", "Правило", "I'm working now. Are you listening?"),
    exercise("blk_pc_2", "Упражнение 1. Что происходит?", "Опишите картинку: что делают люди?"),
  ], { textbookId: efp }),
  lesson("les_countable", "Countable and Uncountable", [
    text("blk_cu_1", "Правило", "some apples, some water, a lot of, much, many"),
    exercise("blk_cu_2", "Упражнение 1. Much или many?", "How ___ sugar? How ___ eggs?"),
  ], { textbookId: efp }),
  lesson("les_past_continuous", "Past Continuous", [
    text("blk_pco_1", "Правило", "I was sleeping when the phone rang."),
    exercise("blk_pco_2", "Упражнение 1. Соедините части", "While I was walking… / …I saw an old friend."),
  ], { textbookId: efp }),

  // Speakout Intermediate
  lesson("les_question_forms", "Question Forms", [
    text("blk_qf_1", "Правило", "Who called you? Who did you call?"),
    exercise("blk_qf_2", "Упражнение 1. Исправьте ошибки", "Where you live? What means this word?"),
  ], { textbookId: spk }),
  lesson("les_narrative_tenses", "Narrative Tenses", [
    text("blk_nt_1", "Правило", "Past Simple, Past Continuous, Past Perfect в рассказе."),
    exercise("blk_nt_2", "Упражнение 1. История", "Продолжите историю: It was a dark night…"),
  ], { textbookId: spk }),

  // Business English (no sections)
  lesson("les_meetings", "Meetings", [
    text("blk_mt_1", "Фразы", "Let's get started. Could we move on to…?"),
    exercise("blk_mt_2", "Упражнение 1. Ролевая игра", "Проведите короткую планёрку."),
  ], { textbookId: bus }),
  lesson("les_emails", "Writing Emails", [
    text("blk_em_1", "Структура", "Greeting, purpose, details, closing."),
    exercise("blk_em_2", "Упражнение 1. Письмо", "Напишите письмо с просьбой перенести встречу."),
  ], { textbookId: bus }),

  // Grammar Practice A2
  lesson("les_present_perfect", "Present Perfect", [
    text("blk_pp_1", "Правило", "I have been to Paris. Have you ever…?"),
    exercise("blk_pp_2", "Упражнение 1. Ever / never", "Составьте 5 вопросов с Have you ever…?"),
  ], { textbookId: gpa }),
  lesson("les_going_to", "Going to", [
    text("blk_gt_1", "Правило", "I'm going to study tonight."),
    exercise("blk_gt_2", "Упражнение 1. Планы", "Расскажите о планах на выходные."),
  ], { textbookId: gpa }),
  lesson("les_articles", "Articles", [
    text("blk_ar_1", "Правило", "a / an / the / —"),
    exercise("blk_ar_2", "Упражнение 1. Вставьте артикль", "I saw ___ cat. ___ cat was black."),
  ], { textbookId: gpa }),
];

const efi = "tb_ef_intermediate";
const otc = "tb_outcomes";
const viu = "tb_vocab_b1";
const ilt = "tb_ielts";
const phv = "tb_phrasal";

const moreTextbookLessons: Lesson[] = [
  ...([
    ["les_present_tenses_review", "Present Tenses Review", "Present Simple vs Continuous: I usually cook, but today I'm ordering in.", "Выберите время", "I ___ (not / eat) meat. Look, he ___ (eat) my sandwich!"],
    ["les_future_forms", "Future Forms", "will, going to, Present Continuous для планов.", "Планы и прогнозы", "Расскажите о планах на следующую неделю тремя способами."],
    ["les_present_perfect_cont", "Present Perfect Continuous", "I've been saving for a year.", "Как долго?", "How long have you been learning English?"],
    ["les_money_vocab", "Money Vocabulary", "borrow, lend, owe, afford, save up, a loan", "Диалог в банке", "Попросите в банке кредит на учёбу."],
    ["les_transport", "Getting Around", "commute, rush hour, traffic jam, give someone a lift", "Мой путь на работу", "Опишите свою дорогу на работу или учёбу."],
    ["les_used_to", "Used to and Would", "I used to live in Kazan. We would play outside all day.", "Детство", "Пять вещей, которые вы делали в детстве."],
  ] as LessonSpec[]).map((spec) => simpleLesson(spec, { textbookId: efi })),
  ...([
    ["les_film_reviews", "Talking About Films", "plot, cast, it's set in, it's based on", "Рецензия", "Расскажите о фильме, который недавно посмотрели."],
    ["les_habits", "Habits in the Past", "used to, would, kept + -ing", "Привычки", "Какие привычки вы бросили и почему?"],
    ["les_relative_clauses", "Relative Clauses", "who, which, that, where, whose", "Соедините предложения", "This is the café. We met there. → This is the café where…"],
    ["les_making_recommendations", "Making Recommendations", "You should definitely… It's worth visiting…", "Гид по городу", "Порекомендуйте три места в своём городе."],
    ["les_third_conditional", "Third Conditional", "If I had known, I would have come.", "Сожаления", "Закончите: If I hadn't missed the bus, …"],
  ] as LessonSpec[]).map((spec) => simpleLesson(spec, { textbookId: otc })),
  ...([
    ["les_describing_character", "Describing Character", "reliable, outgoing, stubborn, easy-going", "Портрет друга", "Опишите характер близкого друга."],
    ["les_relationships", "Relationships", "get on with, fall out, make up, a close friend", "Истории", "Расскажите о ссоре и примирении."],
    ["les_jobs", "Jobs and Careers", "apply for, be promoted, retire, a career path", "Карьера", "Опишите карьеру человека, которым вы восхищаетесь."],
    ["les_office", "In the Office", "deadline, a meeting room, a printer jam, working hours", "Рабочий день", "Опишите типичный день в офисе."],
    ["les_city_life", "City Life", "crowded, lively, polluted, a suburb, nightlife", "Город или деревня", "Где лучше жить и почему?"],
  ] as LessonSpec[]).map((spec) => simpleLesson(spec, { textbookId: viu })),
  ...([
    ["les_ielts_part1", "Part 1: Familiar Topics", "Короткие ответы с одной деталью: I'm a student, actually I study law.", "Вопросы о себе", "Ответьте на 6 вопросов о работе и доме."],
    ["les_ielts_part2", "Part 2: Long Turn", "1 минута на подготовку, 2 минуты речи по карточке.", "Карточка", "Describe a place you like to visit."],
    ["les_ielts_part3", "Part 3: Discussion", "Обобщения, сравнения, примеры: In general… whereas…", "Дискуссия", "Should tourism be limited in popular cities?"],
    ["les_ielts_fluency", "Fluency and Linking", "Связки: on top of that, having said that, as a result", "Связная речь", "Перескажите новость, используя 5 связок."],
  ] as LessonSpec[]).map((spec) => simpleLesson(spec, { textbookId: ilt })),
  ...([
    ["les_pv_travel", "Phrasal Verbs: Travel", "set off, check in, get away, look around", "Отпуск", "Расскажите о поездке, используя 4 фразовых глагола."],
    ["les_pv_work", "Phrasal Verbs: Work", "carry out, deal with, take on, set up", "Задачи", "Опишите проект, используя фразовые глаголы."],
    ["les_pv_relationships", "Phrasal Verbs: Relationships", "get along, break up, look up to, ask out", "Сериал", "Перескажите сюжет любимого сериала."],
    ["les_pv_everyday", "Phrasal Verbs: Everyday Life", "wake up, turn off, run out of, tidy up", "Утро", "Опишите своё утро."],
  ] as LessonSpec[]).map((spec) => simpleLesson(spec, { textbookId: phv })),
];

type TextbookSpec = Omit<Textbook, "description" | "meta" | "useSections" | "coverImage" | "author" | "catalogSourceId">;

const textbookSpecs: TextbookSpec[] = [
  {
    id: efe,
    title: "English File Elementary",
    folderId: "fld_publishers",
    sections: [
      { id: "sec_efe_1", title: "Unit 1 — Getting Started", order: 0,
        lessonIds: ["les_introductions", "les_present_simple", "les_daily_routines"] },
      { id: "sec_efe_2", title: "Unit 2 — Everyday Life", order: 1,
        lessonIds: ["les_past_simple", "les_my_weekend"] },
    ],
    looseLessonIds: [],
    cover: "blue",
    updatedAt: at("2026-09-01"),
  },
  {
    id: efp,
    title: "English File Pre-Intermediate",
    folderId: "fld_publishers",
    sections: [
      { id: "sec_efp_1", title: "Unit 1 — Food and Family", order: 0,
        lessonIds: ["les_present_continuous", "les_countable"] },
      { id: "sec_efp_2", title: "Unit 2 — Holidays", order: 1,
        lessonIds: ["les_past_continuous"] },
    ],
    looseLessonIds: [],
    cover: "violet",
    updatedAt: at("2026-09-01"),
  },
  {
    id: spk,
    title: "Speakout Intermediate",
    folderId: "fld_publishers",
    sections: [
      { id: "sec_spk_1", title: "Unit 1 — Identity", order: 0, lessonIds: ["les_question_forms"] },
      { id: "sec_spk_2", title: "Unit 2 — Tales", order: 1, lessonIds: ["les_narrative_tenses"] },
    ],
    looseLessonIds: [],
    cover: "orange",
    updatedAt: at("2026-09-01"),
  },
  {
    id: bus,
    title: "Business English",
    folderId: null,
    sections: [],
    looseLessonIds: ["les_meetings", "les_emails"],
    cover: "teal",
    updatedAt: at("2026-09-01"),
  },
  {
    id: gpa,
    title: "Grammar Practice A2",
    folderId: "fld_grammar",
    sections: [
      { id: "sec_gpa_1", title: "Времена", order: 0, lessonIds: ["les_present_perfect", "les_going_to"] },
      { id: "sec_gpa_2", title: "Артикли и существительные", order: 1, lessonIds: ["les_articles"] },
    ],
    looseLessonIds: [],
    cover: "pink",
    updatedAt: at("2026-09-01"),
  },
  {
    id: efi,
    title: "English File Intermediate",
    folderId: "fld_publishers",
    sections: [
      { id: "sec_efi_1", title: "Unit 1 — Mood Food", order: 0,
        lessonIds: ["les_present_tenses_review", "les_future_forms"] },
      { id: "sec_efi_2", title: "Unit 2 — Money", order: 1,
        lessonIds: ["les_present_perfect_cont", "les_money_vocab"] },
      { id: "sec_efi_3", title: "Unit 3 — Transport", order: 2,
        lessonIds: ["les_transport", "les_used_to"] },
    ],
    looseLessonIds: [],
    cover: "green",
    updatedAt: at("2026-09-01"),
  },
  {
    id: otc,
    title: "Outcomes Upper-Intermediate",
    folderId: "fld_publishers",
    sections: [
      { id: "sec_otc_1", title: "Unit 1 — Entertainment", order: 0,
        lessonIds: ["les_film_reviews", "les_habits"] },
      { id: "sec_otc_2", title: "Unit 2 — Sightseeing", order: 1,
        lessonIds: ["les_relative_clauses", "les_making_recommendations", "les_third_conditional"] },
    ],
    looseLessonIds: [],
    cover: "coral",
    updatedAt: at("2026-09-01"),
  },
  {
    id: viu,
    title: "Vocabulary in Use B1",
    folderId: "fld_vocabulary",
    sections: [
      { id: "sec_viu_1", title: "Люди", order: 0, lessonIds: ["les_describing_character", "les_relationships"] },
      { id: "sec_viu_2", title: "Работа", order: 1, lessonIds: ["les_jobs", "les_office"] },
      { id: "sec_viu_3", title: "Город", order: 2, lessonIds: ["les_city_life"] },
    ],
    looseLessonIds: [],
    cover: "yellow",
    updatedAt: at("2026-09-01"),
  },
  {
    id: ilt,
    title: "IELTS Speaking",
    folderId: "fld_exams",
    sections: [],
    looseLessonIds: ["les_ielts_part1", "les_ielts_part2", "les_ielts_part3", "les_ielts_fluency"],
    cover: "violet",
    updatedAt: at("2026-09-01"),
  },
  {
    id: phv,
    title: "Phrasal Verbs in Context",
    folderId: null,
    sections: [],
    looseLessonIds: ["les_pv_travel", "les_pv_work", "les_pv_relationships", "les_pv_everyday"],
    cover: "blue",
    updatedAt: at("2026-09-01"),
  },
];

/** Every demo textbook is English; age group and level vary so the library filters have something to show. */
const textbookMeta: Record<string, [AgeGroup, Level, description: string]> = {
  [efe]: ["adults", "a1", "Курс для взрослых, которые начинают с нуля или возвращаются к языку."],
  [efp]: ["adults", "a2", ""],
  [spk]: ["adults", "b1", "Видео BBC и реальные ситуации общения."],
  [bus]: ["adults", "b1", "Встречи, письма и переговоры."],
  [gpa]: ["teens", "a2", "Правила и упражнения по грамматике уровня A2."],
  [efi]: ["adults", "b1", ""],
  [otc]: ["adults", "b2", ""],
  [viu]: ["teens", "b1", "Тематическая лексика с упражнениями."],
  [ilt]: ["adults", "c1", "Все три части устной части экзамена."],
  [phv]: ["teens", "b2", "Фразовые глаголы по темам: путешествия, работа, отношения, быт."],
};

const textbooks: Textbook[] = textbookSpecs.map((spec) => {
  const [ageGroup, level, description] = textbookMeta[spec.id];
  return {
    ...spec,
    description,
    meta: { subject: "english", customSubject: "", ageGroup, level },
    useSections: spec.sections.length > 0,
    coverImage: null,
    // One textbook was added from the catalog, so the library shows a material by another author.
    ...(spec.id === phv ? { author: PLANEREE, catalogSourceId: "cat_phrasal" } : { author: null, catalogSourceId: null }),
  };
});

// ───────────── Standalone lessons ─────────────

const standaloneLessons: Lesson[] = [
  lesson("les_passive_voice", "Passive Voice Basics", [
    text("blk_pv_1", "Правило", "The letter was written by Tom."),
    exercise("blk_pv_2", "Упражнение 1. Перефразируйте", "Somebody stole my bike → My bike…"),
  ], { cover: "green" }),
  lesson("les_phone_calls", "Phone Calls", [
    text("blk_ph_1", "Фразы", "Could I speak to…? I'll put you through."),
    exercise("blk_ph_2", "Упражнение 1. Диалог", "Позвоните в отель и забронируйте номер."),
  ]),
  lesson("les_everyday_vocab", "Everyday Vocabulary", [
    text("blk_ev_1", "Лексика", "appointment, schedule, feel, pain, rest, recover"),
    exercise("blk_ev_2", "Упражнение 1. Составьте предложения", "Используйте 5 новых слов в предложениях."),
  ], { cover: "yellow" }),
  lesson("les_weather", "Weather and Seasons", [
    text("blk_we_1", "Лексика", "sunny, cloudy, freezing, humid, a heatwave"),
    exercise("blk_we_2", "Упражнение 1. Прогноз", "Расскажите прогноз погоды на неделю."),
  ]),
  lesson("les_hobbies", "Talking About Hobbies", [
    text("blk_hb_1", "Разговор", "What do you do in your free time?"),
    exercise("blk_hb_2", "Упражнение 1. Опрос", "Узнайте о хобби собеседника: 5 вопросов."),
  ], { folderId: "fld_speaking" }),
  lesson("les_travel", "Travel Small Talk", [
    text("blk_tr_1", "Фразы", "Where are you heading? Is this your first time here?"),
    exercise("blk_tr_2", "Упражнение 1. В аэропорту", "Разыграйте разговор с попутчиком."),
  ], { folderId: "fld_speaking", cover: "coral" }),
  lesson("les_job_interview", "Job Interview", [
    text("blk_ji_1", "Вопросы", "Tell me about yourself. What are your strengths?"),
    exercise("blk_ji_2", "Упражнение 1. Ответы", "Подготовьте ответы на три вопроса."),
  ], { folderId: "fld_speaking" }),
  lesson("les_conditionals", "Zero and First Conditional", [
    text("blk_cd_1", "Правило", "If you heat ice, it melts. If it rains, I'll stay home."),
    exercise("blk_cd_2", "Упражнение 1. Закончите", "If I have time tomorrow, …"),
  ], { folderId: "fld_grammar" }),

  simpleLesson(["les_small_talk", "Small Talk at Work", "How was your weekend? Busy day?", "Кофе-брейк", "Поддержите разговор с коллегой 2 минуты."], { cover: "pink" }),
  simpleLesson(["les_directions", "Giving Directions", "go straight on, take the second left, opposite", "Как пройти", "Объясните дорогу от метро до вашего дома."]),
  simpleLesson(["les_shopping", "Shopping and Prices", "How much is it? Can I try it on? a receipt", "В магазине", "Верните покупку и попросите обмен."], { cover: "orange" }),
  simpleLesson(["les_restaurant", "At the Restaurant", "Could we have the bill? I'd like… Is service included?", "Заказ", "Закажите ужин на троих."]),

  simpleLesson(["les_modals", "Modal Verbs of Obligation", "must, have to, don't have to, mustn't", "Правила", "Правила вашей работы: must / have to / mustn't."], { folderId: "fld_grammar" }),
  simpleLesson(["les_comparatives", "Comparatives and Superlatives", "bigger, more expensive, the best, as… as", "Сравните", "Сравните два города, в которых вы были."], { folderId: "fld_grammar", cover: "violet" }),
  simpleLesson(["les_reported_speech", "Reported Speech", "She said (that) she was tired.", "Перескажите", "Перескажите вчерашний разговор с другом."], { folderId: "fld_grammar" }),
  simpleLesson(["les_second_conditional", "Second Conditional", "If I won the lottery, I would travel.", "Мечты", "What would you do if you didn't have to work?"], { folderId: "fld_grammar" }),

  simpleLesson(["les_debate_remote", "Debate: Remote Work", "I'd argue that… On the other hand… That's a fair point, but…", "Дебаты", "Аргументы за и против удалённой работы."], { folderId: "fld_speaking", cover: "teal" }),
  simpleLesson(["les_describing_people", "Describing People", "tall, curly hair, in his thirties, looks like", "Кто это?", "Опишите человека на фото — собеседник угадывает."], { folderId: "fld_speaking" }),

  simpleLesson(["les_time_idioms", "Idioms About Time", "in the nick of time, kill time, call it a day", "Идиомы в речи", "Составьте историю с тремя идиомами."], { folderId: "fld_vocabulary" }),
  simpleLesson(["les_make_do", "Make and Do", "make a decision, do homework, make a mistake, do the shopping", "Make или do?", "___ a cake, ___ your best, ___ a phone call"], { folderId: "fld_vocabulary", cover: "green" }),
];

const lessons = [...textbookLessons, ...moreTextbookLessons, ...standaloneLessons];
const lessonById = (id: string) => lessons.find((l) => l.id === id)!;

// ───────────── Learner versions, sessions, homework ─────────────

function learnerCopy(
  id: string,
  learnerId: string,
  lessonId: string,
  createdAt: string,
  blocks?: LessonBlock[],
): LearnerLesson {
  return {
    id,
    learnerId,
    sourceLessonId: lessonId,
    title: null,
    content: { blocks: structuredClone(blocks ?? lessonById(lessonId).content.blocks) },
    createdAt,
    updatedAt: createdAt,
  };
}

const learnerLessons: LearnerLesson[] = [
  // Анна — Present Simple with additional practice
  learnerCopy("ll_anna_ps", "anna", "les_present_simple", at("2026-10-07", "15:00"), [
    ...lessonById("les_present_simple").content.blocks,
    adapted(
      exercise(
        "blk_anna_extra",
        "Дополнительная практика Present Simple",
        "Расскажите про распорядок дня вашей подруги: she gets up, she goes…",
      ),
    ),
  ]),
  learnerCopy("ll_anna_intro", "anna", "les_introductions", at("2026-10-01", "15:00")),

  // Максим — Everyday Vocabulary adapted for medical English
  learnerCopy("ll_max_vocab", "maxim", "les_everyday_vocab", at("2026-10-06", "18:00"), [
    adapted(
      text("blk_ev_1", "Медицинская лексика", "appointment, diagnosis, symptoms, prescription, ward, discharge"),
    ),
    adapted(
      exercise(
        "blk_ev_2",
        "Упражнение 1. Составьте предложения",
        "Опишите приём пациента, используя 5 новых слов.",
      ),
    ),
  ]),

  // София — several completed lessons
  learnerCopy("ll_sofia_past", "sofia", "les_past_simple", at("2026-09-24", "12:00")),
  learnerCopy("ll_sofia_weekend", "sofia", "les_my_weekend", at("2026-09-29", "12:00")),
  learnerCopy("ll_sofia_hobbies", "sofia", "les_hobbies", at("2026-10-03", "12:00")),

  // Группа B1
  learnerCopy("ll_b1_qf", "group_b1", "les_question_forms", at("2026-09-30", "19:00")),
  learnerCopy("ll_b1_nt", "group_b1", "les_narrative_tenses", at("2026-10-05", "19:00")),
];

function session(
  id: string,
  learnerId: string,
  learnerLessonId: string,
  startedAt: string,
  completedAt: string | null,
): LessonSession {
  return {
    id,
    learnerId,
    learnerLessonId,
    status: completedAt ? "completed" : "in_progress",
    startedAt,
    completedAt,
    lastActivityAt: completedAt ?? startedAt,
  };
}

const sessions: LessonSession[] = [
  session("ses_anna_intro", "anna", "ll_anna_intro", at("2026-10-01", "15:00"), at("2026-10-01", "16:00")),
  session("ses_anna_ps", "anna", "ll_anna_ps", at("2026-10-07", "15:00"), null),

  session("ses_max_vocab", "maxim", "ll_max_vocab", at("2026-10-06", "18:00"), at("2026-10-06", "19:00")),

  session("ses_sofia_past", "sofia", "ll_sofia_past", at("2026-09-24", "12:00"), at("2026-09-24", "13:00")),
  session("ses_sofia_weekend", "sofia", "ll_sofia_weekend", at("2026-09-29", "12:00"), at("2026-09-29", "13:00")),
  session("ses_sofia_hobbies", "sofia", "ll_sofia_hobbies", at("2026-10-03", "12:00"), at("2026-10-03", "13:00")),

  session("ses_b1_qf", "group_b1", "ll_b1_qf", at("2026-09-30", "19:00"), at("2026-09-30", "20:30")),
  session("ses_b1_nt", "group_b1", "ll_b1_nt", at("2026-10-05", "19:00"), at("2026-10-05", "20:30")),
];

function homework(
  id: string,
  learnerId: string,
  learnerLessonId: string,
  blockId: string | null,
  assignedAt: string,
  status: HomeworkAssignment["status"],
  completedAt: string | null = null,
  reviewedAt: string | null = null,
): HomeworkAssignment {
  const ll = learnerLessons.find((x) => x.id === learnerLessonId)!;
  const block = blockId ? ll.content.blocks.find((b) => b.id === blockId)! : null;
  return {
    id,
    learnerId,
    learnerLessonId,
    title: block ? block.title : lessonById(ll.sourceLessonId).title,
    targetType: block ? "exercise" : "lesson",
    targetId: block ? block.id : ll.id,
    snapshot: structuredClone(block ? [block] : ll.content.blocks),
    status,
    assignedAt,
    completedAt,
    reviewedAt,
  };
}

const homeworkAssignments: HomeworkAssignment[] = [
  homework("hw_anna_extra", "anna", "ll_anna_ps", "blk_anna_extra", at("2026-10-07", "16:00"), "assigned"),
  homework("hw_anna_intro", "anna", "ll_anna_intro", "blk_intro_2", at("2026-10-01", "16:00"), "completed", at("2026-10-03", "20:00")),

  homework("hw_max_vocab", "maxim", "ll_max_vocab", "blk_ev_2", at("2026-10-06", "19:00"), "completed", at("2026-10-07", "21:00")),

  homework("hw_sofia_past", "sofia", "ll_sofia_past", "blk_pas_2", at("2026-09-24", "13:00"), "reviewed", at("2026-09-26", "18:00"), at("2026-09-27", "10:00")),
  homework("hw_sofia_weekend", "sofia", "ll_sofia_weekend", null, at("2026-09-29", "13:00"), "reviewed", at("2026-10-01", "18:00"), at("2026-10-02", "10:00")),
  homework("hw_sofia_hobbies", "sofia", "ll_sofia_hobbies", "blk_hb_2", at("2026-10-03", "13:00"), "completed", at("2026-10-06", "18:00")),

  homework("hw_b1_qf", "group_b1", "ll_b1_qf", "blk_qf_2", at("2026-09-30", "20:30"), "reviewed", at("2026-10-02", "18:00"), at("2026-10-03", "10:00")),
  homework("hw_b1_nt", "group_b1", "ll_b1_nt", "blk_nt_2", at("2026-10-05", "20:30"), "assigned"),
];

// ───────────── Long histories ─────────────
// Anna, Maxim and Group B1 have studied for months: 20+ finished lessons each,
// with homework in every state. Generated going back in time from `before`.

const day = (date: string, offset: number) => {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

type HomeworkPlan = HomeworkAssignment["status"] | null;

/** Mostly reviewed; a few lessons without homework; recent ones still open. */
function homeworkPlan(i: number, offset: number): HomeworkPlan {
  if (i === 0) return "completed";
  if (i === 1) return "assigned";
  if ((i + offset) % 5 === 0) return null;
  if ((i + offset) % 7 === 3) return "completed";
  return "reviewed";
}

function longHistory(learnerId: string, time: string, before: string, lessonIds: string[], offset = 0) {
  const result = { learnerLessons: [] as LearnerLesson[], sessions: [] as LessonSession[], homework: [] as HomeworkAssignment[] };
  lessonIds.forEach((lessonId, i) => {
    const key = `${learnerId}_${lessonId.replace(/^les_/, "")}`;
    const date = day(before, -(i * 3 + 1 + (i % 2)));
    const start = at(date, time);
    const end = at(date, `${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}${time.slice(2)}`);
    const ll = learnerCopy(`ll_${key}`, learnerId, lessonId, start);
    result.learnerLessons.push(ll);
    result.sessions.push(session(`ses_${key}`, learnerId, ll.id, start, end));

    const status = homeworkPlan(i, offset);
    if (!status) return;
    const block = ll.content.blocks.find((b) => b.type === "exercise") ?? null;
    result.homework.push({
      id: `hw_${key}`,
      learnerId,
      learnerLessonId: ll.id,
      title: block ? block.title : lessonById(lessonId).title,
      targetType: block ? "exercise" : "lesson",
      targetId: block ? block.id : ll.id,
      snapshot: structuredClone(block ? [block] : ll.content.blocks),
      status,
      assignedAt: end,
      completedAt: status === "assigned" ? null : at(day(date, 2), "19:00"),
      reviewedAt: status === "reviewed" ? at(day(date, 3), "09:00") : null,
    });
  });
  return result;
}

const longHistories = [
  longHistory("anna", "15:00", "2026-10-01", [
    "les_present_continuous", "les_countable", "les_past_continuous", "les_present_tenses_review",
    "les_future_forms", "les_present_perfect_cont", "les_money_vocab", "les_transport", "les_used_to",
    "les_hobbies", "les_travel", "les_phone_calls", "les_everyday_vocab", "les_small_talk",
    "les_directions", "les_shopping", "les_restaurant", "les_modals", "les_comparatives",
    "les_describing_people", "les_pv_travel", "les_pv_everyday", "les_time_idioms",
  ]),
  longHistory("maxim", "18:00", "2026-10-06", [
    "les_meetings", "les_emails", "les_job_interview", "les_small_talk", "les_phone_calls",
    "les_office", "les_jobs", "les_pv_work", "les_debate_remote", "les_making_recommendations",
    "les_relative_clauses", "les_reported_speech", "les_second_conditional", "les_conditionals",
    "les_passive_voice", "les_film_reviews", "les_habits", "les_third_conditional",
    "les_describing_character", "les_relationships", "les_ielts_part1", "les_ielts_part2",
  ], 2),
  longHistory("group_b1", "19:00", "2026-09-30", [
    "les_ielts_part1", "les_ielts_part2", "les_ielts_part3", "les_ielts_fluency", "les_film_reviews",
    "les_habits", "les_relative_clauses", "les_making_recommendations", "les_third_conditional",
    "les_city_life", "les_relationships", "les_describing_character", "les_jobs", "les_time_idioms",
    "les_make_do", "les_pv_relationships", "les_pv_work", "les_reported_speech", "les_modals",
    "les_debate_remote", "les_present_perfect", "les_going_to",
  ], 4),
];

// ───────────── Learners ─────────────

type Student = Omit<AppData["learners"][number], "type">;
const student = (s: Student): AppData["learners"][number] => ({ type: "individual", ...s });

// Order matters: the learner strip shows the first ones, the rest go to «Ещё».
const learners: AppData["learners"] = [
  student({ id: "anna", name: "Анна Кузнецова", avatarColor: "pink",
    email: "anna.kuznetsova@mail.ru", schedule: ["Понедельник, 17:00", "Четверг, 18:30"], lessonsLeft: 6 }),
  student({ id: "maxim", name: "Максим Лебедев", avatarColor: "orange",
    email: "m.lebedev@gmail.com", schedule: ["Вторник, 08:00", "Пятница, 08:00"], lessonsLeft: 3 }),
  student({ id: "sofia", name: "София Ким", avatarColor: "teal",
    email: "sofia.kim@yandex.ru", schedule: ["Среда, 12:00"], lessonsLeft: 8 }),
  student({ id: "pasha", name: "Паша", avatarColor: "violet", avatarUrl: "/avatars/pasha.svg",
    email: "pasha2012@mail.ru", invitePending: true, schedule: ["Суббота, 11:00"], lessonsLeft: 4 }),
  { id: "group_a2", name: "Группа A2", type: "group", avatarColor: "green",
    memberIds: ["irina", "timur", "vera", "artem"] },
  { id: "group_b1", name: "Группа B1", type: "group", avatarColor: "blue",
    memberIds: ["olga", "denis", "liza", "artur", "kseniya"] },
  student({ id: "elena", name: "Елена Миронова", avatarColor: "yellow",
    email: "elena.mironova@gmail.com", invitePending: true, schedule: ["Понедельник, 10:00"], lessonsLeft: 10 }),
  student({ id: "dmitry", name: "Дмитрий Орлов", avatarColor: "coral",
    email: "d.orlov@outlook.com", schedule: ["Четверг, 20:00"], lessonsLeft: 2 }),
  // Ксения and Артём also study in a group; Ксения has a one-to-one history too.
  student({ id: "kseniya", name: "Ксения Белова", avatarColor: "pink",
    email: "ksenia.belova@mail.ru", schedule: ["Вторник, 19:00", "Суббота, 10:00"], lessonsLeft: 5 }),
  student({ id: "artem", name: "Артём Власов", avatarColor: "teal",
    email: "artem.vlasov@gmail.com", invitePending: true, schedule: ["Среда, 18:00", "Пятница, 19:00"], lessonsLeft: 7 }),
  student({ id: "polina", name: "Полина Зайцева", avatarColor: "violet",
    email: "polina.z@yandex.ru", schedule: ["Пятница, 16:00"], lessonsLeft: 1 }),
  // Students who so far have only studied in a group.
  student({ id: "irina", name: "Ирина Соколова", avatarColor: "coral",
    email: "irina.sokolova@mail.ru", invitePending: true, schedule: ["Пятница, 19:00"], lessonsLeft: 8 }),
  student({ id: "timur", name: "Тимур Алиев", avatarColor: "blue",
    email: "timur.aliev@gmail.com", schedule: ["Пятница, 19:00"], lessonsLeft: 8 }),
  student({ id: "vera", name: "Вера Новикова", avatarColor: "yellow",
    email: "vera.novikova@yandex.ru", schedule: ["Пятница, 19:00"], lessonsLeft: 4 }),
  student({ id: "olga", name: "Ольга Петрова", avatarColor: "green",
    email: "olga.petrova@mail.ru", schedule: ["Вторник, 19:00"], lessonsLeft: 6 }),
  student({ id: "denis", name: "Денис Морозов", avatarColor: "orange",
    email: "denis.morozov@gmail.com", invitePending: true, schedule: ["Вторник, 19:00"], lessonsLeft: 6 }),
  student({ id: "liza", name: "Лиза Фёдорова", avatarColor: "violet",
    email: "liza.fedorova@yandex.ru", schedule: ["Вторник, 19:00"], lessonsLeft: 3 }),
  student({ id: "artur", name: "Артур Ким", avatarColor: "teal",
    email: "artur.kim@mail.ru", schedule: ["Вторник, 19:00"], lessonsLeft: 9 }),
];

/** Two sales of the grammar textbook, already saved by the buyers. */
const shareLinks: ShareLink[] = [
  { token: "dGx0OmRlbW8tc2FsZS0x", kind: "textbook", materialId: gpa, createdAt: "2026-10-20T09:12:00.000Z",
    savedBy: { id: "acc_olga", name: "Ольга Смирнова" }, savedAt: "2026-10-20T18:40:00.000Z" },
  { token: "dGx0OmRlbW8tc2FsZS0y", kind: "textbook", materialId: gpa, createdAt: "2026-10-26T11:05:00.000Z",
    savedBy: { id: "acc_denis", name: "Денис Орлов" }, savedAt: "2026-10-26T12:30:00.000Z" },
];

export function createDemoData(): AppData {
  return structuredClone({
    teacher: { id: "teacher", name: "Мария Иванова" },
    learners,
    folders,
    textbooks,
    lessons,
    learnerLessons: [...learnerLessons, ...longHistories.flatMap((h) => h.learnerLessons)],
    sessions: [...sessions, ...longHistories.flatMap((h) => h.sessions)],
    homework: [...homeworkAssignments, ...longHistories.flatMap((h) => h.homework)],
    shareLinks,
  });
}

/** A teacher who has just joined: no students, groups or materials of their own yet. */
export function createEmptyData(): AppData {
  return {
    teacher: { id: "teacher", name: "Мария Иванова" },
    learners: [],
    folders: [],
    textbooks: [],
    lessons: [],
    learnerLessons: [],
    sessions: [],
    homework: [],
    shareLinks: [],
  };
}
