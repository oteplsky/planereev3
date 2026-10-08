"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, BookX, Check, Ellipsis, FolderOutput, ListPlus, Pencil, Trash2 } from "lucide-react";
import { ContextBadge } from "@/components/ContextBadge";
import { ActionsMenu, AddTile, MaterialCard, type CardActions } from "@/components/library/Cards";
import { Cover } from "@/components/library/Cover";
import { LibraryDialogs, requestDelete, type DialogState } from "@/components/library/LibraryDialogs";
import { SectionLabel } from "@/components/library/Library";
import { LessonStatusBadge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog, Dialog, PromptDialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Menu } from "@/components/ui/Menu";
import { toast } from "@/components/ui/Toast";
import { contextHref, useActiveLearner } from "@/lib/context";
import { deleteSection, folderPath, lessonStatusForLearner, textbookLessons } from "@/lib/domain";
import { count, LESSONS, plural } from "@/lib/format";
import { forLearner } from "@/lib/learners";
import { useStore } from "@/lib/store";
import type { Lesson, Textbook, TextbookSection } from "@/lib/types";

/** Textbook-specific dialogs; generic rename/move/delete reuse LibraryDialogs. */
type TextbookDialog =
  | null
  | { type: "addLesson"; sectionId: string | null }
  | { type: "addSection" }
  | { type: "renameSection"; section: TextbookSection }
  | { type: "deleteSection"; section: TextbookSection }
  | { type: "moveLesson"; lesson: Lesson; fromSectionId: string | null };

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

/** Spec §6: sections and lessons of one textbook. Same structure in every context; editable only globally. */
export function TextbookScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const learner = useActiveLearner();
  const data = useStore((s) => s.data);
  const store = useStore();
  const [libDialog, setLibDialog] = useState<DialogState>(null);
  const [dialog, setDialog] = useState<TextbookDialog>(null);

  const learnerId = learner?.id ?? null;
  const editable = learner === null;
  const textbook = data.textbooks.find((t) => t.id === id);

  if (!textbook) {
    return (
      <EmptyState
        icon={<BookX size={28} strokeWidth={1.5} aria-hidden />}
        title="Учебник не найден"
        description="Возможно, его удалили. Вернитесь в библиотеку."
        action={<Button onClick={() => router.push(contextHref("/library", learnerId))}>В библиотеку</Button>}
      />
    );
  }

  const { sections, loose } = textbookLessons(data, textbook);
  const ordered = [...sections.flatMap((s) => s.lessons), ...loose];
  const lessonNumber = (lessonId: string) => ordered.findIndex((l) => l.id === lessonId) + 1;
  const libraryHref = contextHref("/library", learnerId, { folder: textbook.folderId });
  const textbookTarget = { kind: "textbook" as const, id: textbook.id, title: textbook.title };

  const requestSectionDelete = (section: TextbookSection) => {
    // Dry run against the pure rule: explain a block up front instead of confirming first.
    const check = deleteSection(data, textbook.id, section.id, new Date().toISOString());
    if (!check.ok) {
      setLibDialog({
        type: "blocked",
        reason: check.reason,
        title: "В разделе есть уроки, по которым уже занимались",
        description:
          "Удаление раздела удалит и его уроки, а с ними — историю и домашние задания учеников. Перенесите эти уроки в другой раздел или уберите из учебника, а потом удалите раздел.",
      });
      return;
    }
    setDialog({ type: "deleteSection", section });
  };

  const lessonActions = (lesson: Lesson, sectionId: string | null): CardActions => {
    const target = { kind: "lesson" as const, id: lesson.id, title: lesson.title };
    return {
      onRename: () => setLibDialog({ type: "rename", target }),
      onDuplicate: () => {
        store.duplicateMaterial("lesson", lesson.id);
        toast("Копия урока создана");
      },
      onMove: sections.length > 0 ? () => setDialog({ type: "moveLesson", lesson, fromSectionId: sectionId }) : undefined,
      moveLabel: "Переместить в раздел",
      extra: [
        {
          label: "Убрать из учебника",
          icon: <FolderOutput {...iconProps} />,
          onSelect: () => {
            store.removeLessonFromTextbook(lesson.id);
            toast("Урок перенесён в корень библиотеки");
          },
        },
      ],
      onDelete: () => setLibDialog(requestDelete(data, target)),
    };
  };

  const lessonGrid = (lessons: Lesson[], sectionId: string | null) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {lessons.map((lesson) => (
        <MaterialCard
          key={lesson.id}
          href={contextHref(`/lesson/${lesson.id}`, learnerId)}
          kind="lesson"
          title={lesson.title}
          leading={
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-light font-bold text-action" aria-hidden>
              {lessonNumber(lesson.id)}
            </span>
          }
          badge={learnerId && <LessonStatusBadge status={lessonStatusForLearner(data, learnerId, lesson.id)} />}
          actions={editable ? lessonActions(lesson, sectionId) : undefined}
        />
      ))}
      {editable && (
        <AddTile label="Добавить урок" className="min-h-[74px]" onClick={() => setDialog({ type: "addLesson", sectionId })} />
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-5">
        <Breadcrumbs
          items={[
            { label: "Библиотека", href: contextHref("/library", learnerId) },
            ...folderPath(data, textbook.folderId).map((f) => ({
              label: f.name,
              href: contextHref("/library", learnerId, { folder: f.id }),
            })),
          ]}
          current={textbook.title}
        />

        <div className="flex items-start gap-5">
          <div className="hidden w-36 shrink-0 overflow-hidden rounded-md border border-line sm:block">
            <Cover cover={textbook.cover} kind="textbook" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-h1">{textbook.title}</h1>
            <p className="mt-1 text-body-lg text-ink-secondary">
              Учебник · {count(ordered.length, LESSONS)}
              {sections.length > 0 && ` · ${count(sections.length, ["раздел", "раздела", "разделов"])}`}
            </p>
            <div className="mt-3">
              <ContextBadge
                learner={learner}
                learnerLabel={learner ? `Уроки откроются в версии ${forLearner(learner)}` : undefined}
                globalLabel="Редактирование общего материала"
              />
            </div>
          </div>
          {editable && (
            <ActionsMenu
              title={textbook.title}
              actions={{
                onRename: () => setLibDialog({ type: "rename", target: textbookTarget }),
                onDuplicate: () => {
                  store.duplicateMaterial("textbook", textbook.id);
                  toast("Копия учебника создана");
                },
                onMove: () => setLibDialog({ type: "move", target: textbookTarget }),
                onDelete: () => setLibDialog(requestDelete(data, textbookTarget)),
              }}
            />
          )}
        </div>
      </header>

      {ordered.length === 0 && sections.length === 0 && !editable && (
        <EmptyState
          icon={<ListPlus size={28} strokeWidth={1.5} aria-hidden />}
          title="В учебнике пока нет уроков"
          description="Уроки добавляются в разделе «Библиотека»."
        />
      )}

      {sections.map(({ section, lessons }, index) => (
        <section key={section.id} aria-labelledby={`sec-${section.id}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h2 id={`sec-${section.id}`} className="text-caption font-bold tracking-wider text-ink-secondary uppercase">
                {section.title}
              </h2>
              <span className="text-caption text-neutral-400">{count(lessons.length, LESSONS)}</span>
            </div>
            {editable && (
              <Menu
                items={[
                  { label: "Переименовать", icon: <Pencil {...iconProps} />, onSelect: () => setDialog({ type: "renameSection", section }) },
                  ...(index > 0
                    ? [{ label: "Переместить выше", icon: <ArrowUp {...iconProps} />, onSelect: () => store.moveSection(textbook.id, section.id, -1) }]
                    : []),
                  ...(index < sections.length - 1
                    ? [{ label: "Переместить ниже", icon: <ArrowDown {...iconProps} />, onSelect: () => store.moveSection(textbook.id, section.id, 1) }]
                    : []),
                  { label: "Удалить раздел", icon: <Trash2 {...iconProps} />, danger: true, onSelect: () => requestSectionDelete(section) },
                ]}
                trigger={(props) => (
                  <IconButton {...props} label={`Действия с разделом: ${section.title}`} size="sm">
                    <Ellipsis size={20} strokeWidth={1.75} />
                  </IconButton>
                )}
              />
            )}
          </div>
          {lessons.length === 0 && !editable ? (
            <p className="text-ink-secondary">В разделе пока нет уроков.</p>
          ) : (
            lessonGrid(lessons, section.id)
          )}
        </section>
      ))}

      {(loose.length > 0 || (editable && sections.length === 0)) && (
        <section aria-label={sections.length > 0 ? "Без раздела" : "Уроки"}>
          {sections.length > 0 && <SectionLabel label="Без раздела" count={loose.length} />}
          {lessonGrid(loose, null)}
        </section>
      )}

      {editable && (
        <div>
          <Button icon={<ListPlus size={20} strokeWidth={1.75} aria-hidden />} onClick={() => setDialog({ type: "addSection" })}>
            Добавить раздел
          </Button>
        </div>
      )}

      {editable && (
        <>
          <LibraryDialogs
            state={libDialog}
            onClose={() => setLibDialog(null)}
            folderId={textbook.folderId}
            onDeleted={(target) => target.kind === "textbook" && router.push(libraryHref)}
          />
          <TextbookDialogs textbook={textbook} sections={sections.map((s) => s.section)} state={dialog} onClose={() => setDialog(null)} />
        </>
      )}
    </div>
  );
}

function TextbookDialogs({
  textbook,
  sections,
  state,
  onClose,
}: {
  textbook: Textbook;
  sections: TextbookSection[];
  state: TextbookDialog;
  onClose: () => void;
}) {
  const store = useStore();
  const sectionLessonCount = state?.type === "deleteSection" ? state.section.lessonIds.length : 0;

  return (
    <>
      <PromptDialog
        open={state?.type === "addLesson"}
        title="Новый урок"
        label="Название урока"
        placeholder="Например, Present Perfect"
        submitLabel="Создать"
        onClose={onClose}
        onSubmit={(title) => {
          if (state?.type !== "addLesson") return;
          store.createLesson(title, { textbookId: textbook.id, sectionId: state.sectionId ?? undefined });
          toast("Урок добавлен");
        }}
      />
      <PromptDialog
        open={state?.type === "addSection"}
        title="Новый раздел"
        label="Название раздела"
        placeholder="Например, Unit 3 — Travel"
        submitLabel="Добавить"
        onClose={onClose}
        onSubmit={(title) => {
          store.addSection(textbook.id, title);
          toast("Раздел добавлен");
        }}
      />
      <PromptDialog
        open={state?.type === "renameSection"}
        title="Переименовать раздел"
        label="Название"
        initialValue={state?.type === "renameSection" ? state.section.title : ""}
        submitLabel="Сохранить"
        onClose={onClose}
        onSubmit={(title) => {
          if (state?.type !== "renameSection") return;
          store.renameSection(textbook.id, state.section.id, title);
          toast("Название обновлено");
        }}
      />
      <ConfirmDialog
        open={state?.type === "deleteSection"}
        title={state?.type === "deleteSection" ? `Удалить раздел «${state.section.title}»?` : ""}
        description={
          sectionLessonCount > 0
            ? `Раздел удалится вместе с ${sectionLessonCount} ${plural(sectionLessonCount, ["уроком", "уроками", "уроками"])}. Это действие нельзя отменить.`
            : "Это действие нельзя отменить."
        }
        confirmLabel="Удалить"
        onClose={onClose}
        onConfirm={() => {
          if (state?.type !== "deleteSection") return;
          if (store.deleteSection(textbook.id, state.section.id).ok) toast("Раздел удалён");
        }}
      />
      <Dialog
        open={state?.type === "moveLesson"}
        onClose={onClose}
        title={state?.type === "moveLesson" ? `Переместить «${state.lesson.title}»` : ""}
        footer={
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
        }
      >
        {state?.type === "moveLesson" && (
          <ul className="-mx-2 mt-2">
            {[...sections.map((s) => ({ id: s.id as string | null, title: s.title })), { id: null, title: "Без раздела" }].map(
              (option) => {
                const isCurrent = option.id === state.fromSectionId;
                return (
                  <li key={option.id ?? "loose"}>
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        store.moveLessonInTextbook(textbook.id, state.lesson.id, option.id);
                        toast(`Урок перенесён в «${option.title}»`);
                        onClose();
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left font-medium text-ink transition-colors duration-[120ms] hover:bg-hover disabled:bg-selected"
                    >
                      <span className="flex-1">{option.title}</span>
                      {isCurrent && (
                        <span className="flex items-center gap-1 text-caption text-action">
                          <Check size={14} strokeWidth={2} aria-hidden /> Сейчас здесь
                        </span>
                      )}
                    </button>
                  </li>
                );
              },
            )}
          </ul>
        )}
      </Dialog>
    </>
  );
}
