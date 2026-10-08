// Demo data (spec §14). Fixed ids keep tests and debugging readable.

import type {
  AccentColor,
  AppData,
  HomeworkAssignment,
  LearnerLesson,
  Lesson,
  LessonBlock,
  LessonSession,
  Textbook,
} from "./types";

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
];

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

const textbooks: Textbook[] = [
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
];

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
];

const lessons = [...textbookLessons, ...standaloneLessons];
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
    content: { blocks: structuredClone(blocks ?? lessonById(lessonId).content.blocks) },
    createdAt,
    updatedAt: createdAt,
  };
}

const learnerLessons: LearnerLesson[] = [
  // Анна — Present Simple with additional practice
  learnerCopy("ll_anna_ps", "anna", "les_present_simple", at("2026-10-07", "15:00"), [
    ...lessonById("les_present_simple").content.blocks,
    exercise(
      "blk_anna_extra",
      "Дополнительная практика Present Simple",
      "Расскажите про распорядок дня вашей подруги: she gets up, she goes…",
    ),
  ]),
  learnerCopy("ll_anna_intro", "anna", "les_introductions", at("2026-10-01", "15:00")),

  // Максим — Everyday Vocabulary adapted for medical English
  learnerCopy("ll_max_vocab", "maxim", "les_everyday_vocab", at("2026-10-06", "18:00"), [
    text(
      "blk_ev_1",
      "Лексика",
      "appointment, diagnosis, symptoms, prescription, ward, discharge",
    ),
    exercise(
      "blk_ev_2",
      "Упражнение 1. Составьте предложения",
      "Опишите приём пациента, используя 5 новых слов.",
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

// ───────────── Learners ─────────────

const learners: AppData["learners"] = [
  { id: "anna", name: "Анна Кузнецова", type: "individual", avatarColor: "pink" },
  { id: "maxim", name: "Максим Лебедев", type: "individual", avatarColor: "orange" },
  { id: "sofia", name: "София Ким", type: "individual", avatarColor: "teal" },
  { id: "pasha", name: "Паша", type: "individual", avatarColor: "violet" },
  { id: "group_a2", name: "Группа A2", type: "group", avatarColor: "green",
    members: ["Ирина Соколова", "Тимур Алиев", "Вера Новикова"] },
  { id: "group_b1", name: "Группа B1", type: "group", avatarColor: "blue",
    members: ["Ольга Петрова", "Денис Морозов", "Лиза Фёдорова", "Артур Ким"] },
  { id: "elena", name: "Елена Миронова", type: "individual", avatarColor: "yellow" },
  { id: "dmitry", name: "Дмитрий Орлов", type: "individual", avatarColor: "coral" },
  { id: "kseniya", name: "Ксения Белова", type: "individual", avatarColor: "pink" },
  { id: "artem", name: "Артём Власов", type: "individual", avatarColor: "teal" },
  { id: "polina", name: "Полина Зайцева", type: "individual", avatarColor: "violet" },
];

export function createDemoData(): AppData {
  return structuredClone({
    teacher: { id: "teacher", name: "Мария Иванова" },
    learners,
    folders,
    textbooks,
    lessons,
    learnerLessons,
    sessions,
    homework: homeworkAssignments,
  });
}
