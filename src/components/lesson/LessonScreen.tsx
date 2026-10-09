"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ClipboardPlus, FileX, Info, Pencil, Play, Sparkles } from "lucide-react";
import { ContextBadge } from "@/components/ContextBadge";
import { LessonStatusBadge } from "@/components/ui/Badge";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { Button, IconButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { contextHref, useActiveLearner } from "@/lib/context";
import { folderPath, markAdapted, resolveLesson } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { forLearner, genitive } from "@/lib/learners";
import { useStore } from "@/lib/store";
import type { AppData, Learner, Lesson, LessonBlock, LessonSession } from "@/lib/types";
import { AssignHomeworkDialog } from "./AssignHomeworkDialog";
import { BlockEditor, BlockView } from "./LessonBlocks";

/**
 * Lesson workspace placeholder (spec §12). The same page serves both contexts:
 * globally it edits the shared lesson; for a learner it shows and adapts their version.
 */
export function LessonScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const learner = useActiveLearner();
  const data = useStore((s) => s.data);
  const [editing, setEditing] = useState(false);

  const learnerId = learner?.id ?? null;
  const resolved = resolveLesson(data, id, learnerId);

  if (!resolved) {
    return (
      <EmptyState
        icon={<FileX size={28} strokeWidth={1.5} aria-hidden />}
        title="Урок не найден"
        description="Возможно, его удалили. Вернитесь в библиотеку."
        action={<Button onClick={() => router.push(contextHref("/library", learnerId))}>В библиотеку</Button>}
      />
    );
  }

  const { lesson, content, learnerLesson } = resolved;
  const textbook = data.textbooks.find((t) => t.id === lesson.textbookId) ?? null;
  const parent = textbook
    ? { label: textbook.title, href: contextHref(`/textbook/${textbook.id}`, learnerId) }
    : { label: learner ? learner.name : "Библиотека", href: contextHref("/library", learnerId, { folder: lesson.folderId }) };
  const session = learnerLesson ? latestSession(data, learnerLesson.id) : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <IconButton label={`Назад: ${parent.label}`} onClick={() => router.push(parent.href)}>
            <ArrowLeft size={20} strokeWidth={1.75} />
          </IconButton>
          <Breadcrumbs items={crumbs(data, lesson, learner)} current={lesson.title} />
        </div>

        <div>
          <h1 className="text-h1">{lesson.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ContextBadge learner={learner} />
            {session && (
              <span className="flex items-center gap-2 text-ink-secondary">
                <LessonStatusBadge status={session.status} />
                {session.status === "in_progress"
                  ? `начат ${formatDate(session.startedAt)}`
                  : `завершён ${formatDate(session.completedAt!)}`}
              </span>
            )}
          </div>
        </div>

        {!editing &&
          (learner ? (
            <LearnerActions learner={learner} lesson={lesson} blocks={content.blocks} session={session} onAdapt={() => setEditing(true)} />
          ) : (
            <div>
              <Button icon={<Pencil size={18} strokeWidth={1.75} aria-hidden />} onClick={() => setEditing(true)}>
                Редактировать
              </Button>
            </div>
          ))}
      </header>

      <section aria-label="Пространство урока" className="rounded-xl border border-line p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-caption font-bold tracking-wider text-ink-secondary uppercase">Пространство урока</h2>
          <span className="text-caption text-ink-secondary">Конструктор появится позже — сейчас здесь упрощённое содержание</span>
        </div>

        {editing ? (
          <LessonEditor learner={learner} lesson={lesson} blocks={content.blocks} onDone={() => setEditing(false)} />
        ) : (
          <div className="flex flex-col gap-4">
            {content.blocks.map((block) => (
              <BlockView key={block.id} block={block} adaptedLabel={learner ? `Адаптировано ${forLearner(learner)}` : undefined} />
            ))}
            {content.blocks.length === 0 && <p className="text-ink-secondary">В уроке пока нет блоков.</p>}
          </div>
        )}
      </section>
    </div>
  );
}

function latestSession(data: AppData, learnerLessonId: string): LessonSession | null {
  return (
    data.sessions
      .filter((s) => s.learnerLessonId === learnerLessonId)
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))[0] ?? null
  );
}

function crumbs(data: AppData, lesson: Lesson, learner: Learner | null): Crumb[] {
  const learnerId = learner?.id ?? null;
  const textbook = data.textbooks.find((t) => t.id === lesson.textbookId);
  const folderId = textbook ? textbook.folderId : lesson.folderId;
  return [
    { label: learner ? learner.name : "Библиотека", href: contextHref("/library", learnerId) },
    ...folderPath(data, folderId).map((f) => ({ label: f.name, href: contextHref("/library", learnerId, { folder: f.id }) })),
    ...(textbook ? [{ label: textbook.title, href: contextHref(`/textbook/${textbook.id}`, learnerId) }] : []),
  ];
}

function LearnerActions({
  learner,
  lesson,
  blocks,
  session,
  onAdapt,
}: {
  learner: Learner;
  lesson: Lesson;
  blocks: LessonBlock[];
  session: LessonSession | null;
  onAdapt: () => void;
}) {
  const startLesson = useStore((s) => s.startLesson);
  const completeSession = useStore((s) => s.completeSession);
  const assignHomework = useStore((s) => s.assignHomework);
  const [assigning, setAssigning] = useState(false);
  const inProgress = session?.status === "in_progress";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {inProgress ? (
        <Button
          variant="primary"
          size="lg"
          icon={<span className="size-3 rounded-full bg-lime" aria-hidden />}
          onClick={() => {
            completeSession(session.id);
            toast("Урок завершён и сохранён в истории");
          }}
        >
          Завершить урок
        </Button>
      ) : (
        <Button
          variant="primary"
          size="lg"
          icon={<Play size={18} strokeWidth={2} aria-hidden />}
          onClick={() => {
            startLesson(learner.id, lesson.id);
            toast("Урок начат");
          }}
        >
          Начать урок
        </Button>
      )}
      <Button size="lg" icon={<Sparkles size={18} strokeWidth={1.75} aria-hidden />} onClick={onAdapt}>
        Адаптировать урок
      </Button>
      <Button size="lg" icon={<ClipboardPlus size={18} strokeWidth={1.75} aria-hidden />} onClick={() => setAssigning(true)}>
        Назначить домашку
      </Button>

      <AssignHomeworkDialog
        open={assigning}
        learnerGenitive={genitive(learner)}
        blocks={blocks}
        onClose={() => setAssigning(false)}
        onAssign={(target) => {
          assignHomework(learner.id, lesson.id, target);
          toast("Домашнее задание назначено");
        }}
      />
    </div>
  );
}

function LessonEditor({
  learner,
  lesson,
  blocks,
  onDone,
}: {
  learner: Learner | null;
  lesson: Lesson;
  blocks: LessonBlock[];
  onDone: () => void;
}) {
  const updateGlobal = useStore((s) => s.updateGlobalLessonContent);
  const updateLearner = useStore((s) => s.updateLearnerLessonContent);

  const banner = learner ? (
    <Banner tone="learner" title={`Изменения сохранятся только ${forLearner(learner)}`}>
      Общий урок и версии других учеников не изменятся.
    </Banner>
  ) : (
    <Banner tone="global" title="Редактирование общего материала">
      Изменения увидят ученики, которые ещё не работали с этим уроком. У тех, кто уже занимался по нему, останется
      их версия.
    </Banner>
  );

  return (
    <BlockEditor
      initial={blocks}
      banner={banner}
      saveLabel={learner ? `Сохранить ${forLearner(learner)}` : "Сохранить для всех"}
      onCancel={onDone}
      onSave={(next) => {
        if (learner) {
          updateLearner(learner.id, lesson.id, { blocks: markAdapted(blocks, next) });
          toast(`Сохранено только ${forLearner(learner)}`);
        } else {
          updateGlobal(lesson.id, { blocks: next });
          toast("Общий материал обновлён");
        }
        onDone();
      }}
    />
  );
}

function Banner({ tone, title, children }: { tone: "learner" | "global"; title: string; children: React.ReactNode }) {
  return (
    <div
      role="status"
      className={`flex gap-3 rounded-lg border-l-4 p-4 ${tone === "learner" ? "border-action bg-selected" : "border-warning bg-yellow-softest"}`}
    >
      <Info size={20} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-0.5 text-ink-secondary">{children}</p>
      </div>
    </div>
  );
}
