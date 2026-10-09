# Planeree — Library prototype

A clickable prototype of the Planeree LMS Library for independent language teachers.
It validates navigation, the learner context switch, and lesson personalization:
**one shared library, and an independent version of a lesson for each learner who uses it.**

The interface is in Russian; code and docs are in English. There is no backend —
all data lives in the browser's `localStorage`.

- Design: [Planeree UI kit v1.4](https://planeree-ui-kit.jija123123.chatgpt.site) (light theme) and
  [brand guidelines](https://planeree-brand-guidelines.jija123123.chatgpt.site)
- Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Zustand, Vitest

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # domain rules and helpers
npm run lint
npm run build
```

Requires Node 20.9+ (developed on Node 24).

> This Next.js version differs from older ones. Before changing framework-level code,
> read the bundled docs in `node_modules/next/dist/docs/` (see `AGENTS.md`).

## The core rule

Every lesson has a **global version** in the library. A learner gets **their own version**
only when the teacher does one of three things with that learner:

1. starts the lesson (`startLesson`),
2. adapts it (`updateLearnerLessonContent`),
3. assigns homework from it (`assignHomework`).

Browsing never creates one (`resolveLesson` is read-only). Once created, a learner's version
is independent: later global edits don't reach it, and there is no sync or reset.
The UI never says "copy" — it says «Общий материал» and «Версия для Анны».

Deleting a folder, textbook, section or lesson is blocked (with an explanation) when it
would lose learner history or isn't empty.

## Where things are

```
src/lib/
  types.ts        Data model (spec §13) + `adapted` flag on blocks
  domain.ts       All product rules as pure functions (AppData in → AppData out)
  domain.test.ts  Acceptance scenarios 3–7, deletion rules, demo data integrity
  store.ts        Zustand store persisted to localStorage; thin wrapper over domain.ts
  demo-data.ts    Learners, folders, textbooks, lessons and histories (spec §14)
  context.ts      Learner context from `?learner=` and link helper
  learners.ts     Initials, labels, genitive names («для Анны»)
  format.ts       Russian plurals and dates
src/components/
  ui/             UI kit primitives: Button, Menu, Dialog, Badge, SegmentedControl, …
  library/        The one Library component, shared by global and learner contexts
  textbook/       Textbook view with sections
  learner/        Learner workspace, homework and history
  lesson/         Lesson placeholder: blocks, editor, homework dialog
src/app/          Routes: /library, /textbook/[id], /lesson/[id], /homework, /history
```

Context is part of the URL — `/library?learner=anna`, `/lesson/les_present_simple?learner=anna` —
so refresh and links keep it. No `learner` means the global library.

## Demo walkthrough

| Scenario | Try this |
|---|---|
| Global content | «Библиотека» → «+ Создать», folders, ⋯ menus; open a textbook to manage sections |
| Learner navigation | Switch Библиотека → Анна → Максим in the top strip |
| Personalized lesson | Анна → English File Elementary → Present Simple → «Адаптировать урок» → add an exercise → save. Open the same lesson for Максим: it isn't there |
| Global edits don't propagate | Библиотека → Present Simple → «Редактировать» → change a block. Анна keeps hers; Максим sees the change |
| History | София → any lesson → «Начать урок» → «Завершить урок» → it appears in «История уроков» |
| Resume | Анна → «Продолжить урок» |
| Homework | Максим → lesson → «Назначить домашку»; change status from the card's ⋯ menu |

**Reset demo data:** run `localStorage.removeItem("planeree-library")` in the browser console
and reload. Changing the data shape? Bump `STORAGE_VERSION` in `store.ts`; older saved data is
then replaced by fresh demo data.

## Deploy

Vercel detects Next.js automatically; no extra configuration is needed.
Import the Git repository at [vercel.com/new](https://vercel.com/new) and keep the defaults
(build `npm run build`). The `/` → `/library` redirect lives in `next.config.ts`.
