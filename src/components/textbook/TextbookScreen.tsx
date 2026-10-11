"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, BookX, Check, Ellipsis, FolderOutput, GripVertical, ListPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { ActionsMenu, type CardActions } from "@/components/library/Cards";
import { LibraryDialogs, requestDelete, type DialogState } from "@/components/library/LibraryDialogs";
import { LessonStatusChips } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog, Dialog, PromptDialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Menu } from "@/components/ui/Menu";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toast";
import { contextHref, useActiveLearner } from "@/lib/context";
import {
  deleteSection,
  folderPath,
  homeworkStatusForLearner,
  lessonStatusForLearner,
  textbookLessonCount,
  textbookLessons,
} from "@/lib/domain";
import { useStore } from "@/lib/store";
import type { Lesson, Textbook, TextbookSection } from "@/lib/types";
import { TextbookHeader } from "./TextbookHeader";

/** Textbook-specific dialogs; generic rename/move/delete reuse LibraryDialogs. */
type TextbookDialog =
  | null
  | { type: "addLesson"; sectionId: string | null }
  | { type: "addSection" }
  | { type: "renameSection"; section: TextbookSection }
  | { type: "deleteSection"; section: TextbookSection }
  | { type: "moveLesson"; lesson: Lesson; fromSectionId: string };

/** What is being dragged, and where it would land. `container` is a section id, or null without sections. */
type Drag = { kind: "lesson"; id: string; container: string | null } | { kind: "section"; id: string };
type Drop = { kind: "lesson"; container: string | null; index: number } | { kind: "section"; index: number };

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

/** Before or after the hovered element, by which half the pointer is in. */
const halfIndex = (e: DragEvent, index: number) => {
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientY < r.top + r.height / 2 ? index : index + 1;
};

/** After a keyboard move React may re-create the handle; put focus back on it. */
const refocusHandle = (id: string) =>
  requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-handle="${id}"]`)?.focus());

/**
 * Spec §6: one textbook. «Использовать разделы» picks the structure: Учебник → Уроки, or
 * Учебник → Разделы → Уроки. Same structure in every context; editable only globally.
 */
export function TextbookScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const learner = useActiveLearner();
  const data = useStore((s) => s.data);
  const store = useStore();
  const [libDialog, setLibDialog] = useState<DialogState>(null);
  const [dialog, setDialog] = useState<TextbookDialog>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);

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
  const useSections = textbook.useSections;
  const ordered = useSections ? sections.flatMap((s) => s.lessons) : loose;
  const lessonNumber = (lessonId: string) => ordered.findIndex((l) => l.id === lessonId) + 1;
  const lessonsIn = (container: string | null) =>
    container === null ? loose : (sections.find((s) => s.section.id === container)?.lessons ?? []);
  const libraryHref = contextHref("/library", learnerId, { folder: textbook.folderId });
  const textbookTarget = { kind: "textbook" as const, id: textbook.id, title: textbook.title };

  // ── Reordering: drag and drop, or ↑ ↓ on a focused handle ──

  const moveLesson = (lessonId: string, from: string | null, to: string | null, index: number) => {
    const fromIndex = lessonsIn(from).findIndex((l) => l.id === lessonId);
    // The domain inserts after taking the lesson out, so later positions in the same list shift by one.
    const target = from === to && fromIndex < index ? index - 1 : index;
    if (from === to && target === fromIndex) return;
    store.moveLessonInTextbook(textbook.id, lessonId, to, target);
  };

  const moveSection = (sectionId: string, index: number) => {
    const fromIndex = sections.findIndex((s) => s.section.id === sectionId);
    const target = fromIndex < index ? index - 1 : index;
    if (target !== fromIndex) store.moveSectionTo(textbook.id, sectionId, target);
  };

  const endDrag = () => {
    setDrag(null);
    setDrop(null);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (drag?.kind === "lesson" && drop?.kind === "lesson") moveLesson(drag.id, drag.container, drop.container, drop.index);
    if (drag?.kind === "section" && drop?.kind === "section") moveSection(drag.id, drop.index);
    endDrag();
  };

  const startDrag = (e: DragEvent, next: Drag) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", next.id);
    const row = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-drag-row]");
    if (row) e.dataTransfer.setDragImage(row, 24, 24);
    // Changing the DOM inside dragstart can cancel the drag in Chromium.
    requestAnimationFrame(() => setDrag(next));
  };

  const lessonKeyMove = (e: KeyboardEvent, lesson: Lesson, container: string | null) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const list = lessonsIn(container);
    const i = list.findIndex((l) => l.id === lesson.id);
    const j = i + (e.key === "ArrowUp" ? -1 : 1);
    if (j < 0 || j >= list.length) return;
    store.moveLessonInTextbook(textbook.id, lesson.id, container, j);
    refocusHandle(lesson.id);
  };

  const sectionKeyMove = (e: KeyboardEvent, section: TextbookSection, index: number) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const dir = e.key === "ArrowUp" ? -1 : 1;
    if (index + dir < 0 || index + dir >= sections.length) return;
    store.moveSection(textbook.id, section.id, dir);
    refocusHandle(section.id);
  };

  // ── Actions ──

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

  const lessonActions = (lesson: Lesson, container: string | null): CardActions => {
    const target = { kind: "lesson" as const, id: lesson.id, title: lesson.title };
    return {
      onRename: () => setLibDialog({ type: "rename", target }),
      onDuplicate: () => {
        store.duplicateMaterial("lesson", lesson.id);
        toast("Копия урока создана");
      },
      onMove:
        container !== null && sections.length > 1
          ? () => setDialog({ type: "moveLesson", lesson, fromSectionId: container })
          : undefined,
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

  const addLessonButton = (container: string | null) => (
    <Button variant="ghost" icon={<Plus size={20} strokeWidth={1.75} aria-hidden />} onClick={() => setDialog({ type: "addLesson", sectionId: container })}>
      Добавить урок
    </Button>
  );

  const lessonList = (lessons: Lesson[], container: string | null) => {
    const indicatorAt = (i: number) =>
      drop?.kind === "lesson" && drop.container === container && drop.index === i && <DropLine />;
    return (
      <ol className="flex flex-col gap-2">
        {lessons.map((lesson, i) => (
          <li
            key={lesson.id}
            onDragOver={(e) => {
              if (drag?.kind !== "lesson") return;
              e.preventDefault();
              e.stopPropagation();
              setDrop({ kind: "lesson", container, index: halfIndex(e, i) });
            }}
            onDrop={onDrop}
          >
            {indicatorAt(i)}
            <LessonRow
              lesson={lesson}
              number={lessonNumber(lesson.id)}
              href={contextHref(`/lesson/${lesson.id}`, learnerId)}
              dragging={drag?.id === lesson.id}
              status={
                learnerId && (
                  <LessonStatusChips
                    lesson={lessonStatusForLearner(data, learnerId, lesson.id)}
                    homework={homeworkStatusForLearner(data, learnerId, lesson.id)}
                  />
                )
              }
              handle={
                editable && (
                  <DragHandle
                    id={lesson.id}
                    label={`Переместить урок «${lesson.title}»`}
                    onDragStart={(e) => startDrag(e, { kind: "lesson", id: lesson.id, container })}
                    onDragEnd={endDrag}
                    onKeyDown={(e) => lessonKeyMove(e, lesson, container)}
                  />
                )
              }
              actions={editable ? lessonActions(lesson, container) : undefined}
            />
            {i === lessons.length - 1 && indicatorAt(lessons.length)}
          </li>
        ))}
      </ol>
    );
  };

  /** Lessons can be dropped anywhere on a container, including an empty one: they go to its end. */
  const lessonDropZone = (container: string | null, count: number) => ({
    onDragOver: (e: DragEvent) => {
      if (drag?.kind !== "lesson") return;
      e.preventDefault();
      setDrop({ kind: "lesson", container, index: count });
    },
    onDrop,
  });

  const lessonCount = textbookLessonCount(textbook);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-5">
        <Breadcrumbs
          items={[
            { label: learner ? learner.name : "Библиотека", href: contextHref("/library", learnerId) },
            ...folderPath(data, textbook.folderId).map((f) => ({
              label: f.name,
              href: contextHref("/library", learnerId, { folder: f.id }),
            })),
          ]}
          current={textbook.title}
        />
        <TextbookHeader
          textbook={textbook}
          editable={editable}
          onMove={() => setLibDialog({ type: "move", target: textbookTarget })}
          onDelete={() => setLibDialog(requestDelete(data, textbookTarget))}
        />
      </header>

      <section aria-label="Содержание учебника" className="flex flex-col gap-5">
        {editable && (
          <div>
            <Switch
              label="Использовать разделы"
              checked={useSections}
              onChange={(value) => store.setUseSections(textbook.id, value)}
              lockedReason={lessonCount > 0 ? "Структуру нельзя изменить после добавления уроков" : undefined}
            />
          </div>
        )}

        {!useSections &&
          (loose.length === 0 ? (
            <EmptyState
              icon={<ListPlus size={28} strokeWidth={1.5} aria-hidden />}
              title="В учебнике пока нет уроков"
              action={editable && addLessonButton(null)}
            />
          ) : (
            <div {...lessonDropZone(null, loose.length)} className="flex flex-col items-start gap-3">
              <div className="w-full">{lessonList(loose, null)}</div>
              {editable && addLessonButton(null)}
            </div>
          ))}

        {useSections && sections.length === 0 && (
          <EmptyState
            icon={<ListPlus size={28} strokeWidth={1.5} aria-hidden />}
            title="В учебнике пока нет разделов"
            action={
              editable && (
                <Button icon={<Plus size={20} strokeWidth={1.75} aria-hidden />} onClick={() => setDialog({ type: "addSection" })}>
                  Добавить раздел
                </Button>
              )
            }
          />
        )}

        {useSections && sections.length > 0 && (
          <div className="flex flex-col gap-4">
            {sections.map(({ section, lessons }, index) => (
              <div
                key={section.id}
                onDragOver={(e) => {
                  if (drag?.kind !== "section") return;
                  e.preventDefault();
                  setDrop({ kind: "section", index: halfIndex(e, index) });
                }}
                onDrop={onDrop}
              >
                {drop?.kind === "section" && drop.index === index && <DropLine />}
                <section
                  data-drag-row
                  aria-labelledby={`sec-${section.id}`}
                  {...lessonDropZone(section.id, lessons.length)}
                  className={`flex flex-col gap-3 rounded-lg border bg-surface p-4 transition-[border-color,opacity] duration-[120ms] sm:p-5 ${
                    drag?.id === section.id ? "opacity-40" : ""
                  } ${drop?.kind === "lesson" && drop.container === section.id && lessons.length === 0 ? "border-action" : "border-line"}`}
                >
                  <div className="flex items-center gap-2">
                    {editable && (
                      <DragHandle
                        id={section.id}
                        label={`Переместить раздел «${section.title}»`}
                        onDragStart={(e) => startDrag(e, { kind: "section", id: section.id })}
                        onDragEnd={endDrag}
                        onKeyDown={(e) => sectionKeyMove(e, section, index)}
                      />
                    )}
                    <h2 id={`sec-${section.id}`} className="min-w-0 flex-1 text-h3">
                      {section.title}
                    </h2>
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

                  {lessons.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-line-strong px-4 py-6 text-center">
                      <p className="text-ink-secondary">В разделе пока нет уроков</p>
                      {editable && addLessonButton(section.id)}
                    </div>
                  ) : (
                    <>
                      {lessonList(lessons, section.id)}
                      {editable && <div>{addLessonButton(section.id)}</div>}
                    </>
                  )}
                </section>
                {drop?.kind === "section" && index === sections.length - 1 && drop.index === sections.length && <DropLine />}
              </div>
            ))}
            {editable && (
              <div>
                <Button icon={<Plus size={20} strokeWidth={1.75} aria-hidden />} onClick={() => setDialog({ type: "addSection" })}>
                  Добавить раздел
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

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

function DropLine() {
  return <div aria-hidden className="my-1 h-0.5 rounded-full bg-action" />;
}

interface DragHandleProps {
  id: string;
  label: string;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

/** Drag with the pointer, or focus and press ↑ ↓. */
function DragHandle({ id, label, onDragStart, onDragEnd, onKeyDown }: DragHandleProps) {
  return (
    <button
      type="button"
      draggable
      data-handle={id}
      aria-label={label}
      title={label}
      aria-keyshortcuts="ArrowUp ArrowDown"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onKeyDown={onKeyDown}
      className="relative z-10 grid size-8 shrink-0 cursor-grab place-items-center rounded-sm text-ink-secondary transition-colors duration-[120ms] hover:bg-light hover:text-ink active:cursor-grabbing"
    >
      <GripVertical size={18} strokeWidth={1.75} aria-hidden />
    </button>
  );
}

interface LessonRowProps {
  lesson: Lesson;
  number: number;
  href: string;
  dragging: boolean;
  status?: ReactNode;
  handle?: ReactNode;
  actions?: CardActions;
}

/** One lesson in the textbook's order: the whole row opens it; handle and menu stay separate controls. */
function LessonRow({ lesson, number, href, dragging, status, handle, actions }: LessonRowProps) {
  return (
    <div
      data-drag-row
      className={`group relative flex min-h-14 items-center gap-3 rounded-lg border border-line bg-surface py-2 pr-2 transition-[border-color,opacity] duration-[120ms] hover:border-line-strong ${
        handle ? "pl-1" : "pl-3"
      } ${dragging ? "opacity-40" : ""}`}
    >
      {handle}
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-light text-caption font-bold text-action" aria-hidden>
        {number}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <Link href={href} className="line-clamp-2 font-bold after:absolute after:inset-0 after:rounded-lg">
          {lesson.title}
        </Link>
        {status}
      </div>
      {actions && <ActionsMenu title={lesson.title} actions={actions} />}
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
        title="Удалить раздел?"
        description="Раздел и все уроки внутри него будут удалены. Это действие нельзя отменить."
        confirmLabel="Удалить раздел"
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
            {sections.map((option) => {
              const isCurrent = option.id === state.fromSectionId;
              return (
                <li key={option.id}>
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
            })}
          </ul>
        )}
      </Dialog>
    </>
  );
}
