"use client";

import { ArrowLeft, BookOpen, Check, ChevronRight, Folder as FolderIcon, LibraryBig } from "lucide-react";
import { useState } from "react";
import { CreateTextbookDialog } from "@/components/textbook/CreateTextbookDialog";
import { ConfirmDialog, Dialog, NoticeDialog, PromptDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { ShareDialog } from "./ShareDialog";
import { deleteBlockReason, folderPath, lessonHasLearnerActivity } from "@/lib/domain";
import { blockMessages, KEPT_FOR_LEARNERS } from "@/lib/messages";
import { useStore } from "@/lib/store";
import type { AppData, BlockReason } from "@/lib/types";

export type Target =
  | { kind: "folder"; id: string; title: string }
  | { kind: "lesson" | "textbook"; id: string; title: string };

/** Which dialog is open. One at a time. */
export type DialogState =
  | null
  | { type: "create"; kind: "lesson" | "textbook" | "folder" }
  | { type: "rename"; target: Target }
  | { type: "delete"; target: Target }
  | { type: "blocked"; reason: BlockReason; title?: string; description?: string }
  | { type: "move"; target: Target & { kind: "lesson" | "textbook" } }
  | { type: "share"; target: Target & { kind: "lesson" | "textbook" } }
  | { type: "moveToTextbook"; target: Target & { kind: "lesson" } };

/** What deleting a material removes, and — when learners worked with it — that their copies stay. */
function deleteDescription(data: AppData, kind: "lesson" | "textbook", id: string) {
  const lessonIds = kind === "lesson" ? [id] : data.lessons.filter((l) => l.textbookId === id).map((l) => l.id);
  const used = lessonIds.some((lessonId) => lessonHasLearnerActivity(data, lessonId));
  const what = kind === "lesson" ? "Урок исчезнет из библиотеки." : "Учебник исчезнет из библиотеки вместе со всеми уроками.";
  return `${what} ${used ? KEPT_FOR_LEARNERS : "Это действие нельзя отменить."}`;
}

/** Delete goes straight to an explanation when it would be refused, instead of a confirm that then fails. */
export function requestDelete(data: AppData, target: Target): DialogState {
  const reason = deleteBlockReason(data, target.kind, target.id);
  return reason ? { type: "blocked", reason } : { type: "delete", target };
}

/** Single-field creation. Textbooks have their own form (CreateTextbookDialog). */
const createCopy = {
  lesson: { title: "Новый урок", label: "Название урока", placeholder: "Например, Present Perfect", done: "Урок создан" },
  folder: { title: "Новая папка", label: "Название папки", placeholder: "Например, Грамматика", done: "Папка создана" },
};

const kindNoun = { folder: "папку", lesson: "урок", textbook: "учебник" };

interface LibraryDialogsProps {
  state: DialogState;
  onClose: () => void;
  /** Where new items are created. */
  folderId: string | null;
  /** Called after a successful delete, e.g. to leave a screen whose subject is gone. */
  onDeleted?: (target: Target) => void;
  /** Called after a textbook is created, e.g. to open it. */
  onTextbookCreated?: (textbookId: string) => void;
}

export function LibraryDialogs({ state, onClose, folderId, onDeleted, onTextbookCreated }: LibraryDialogsProps) {
  const store = useStore();
  const simpleCreate = state?.type === "create" && state.kind !== "textbook" ? createCopy[state.kind] : null;

  return (
    <>
      <PromptDialog
        open={!!simpleCreate}
        title={simpleCreate?.title ?? ""}
        label={simpleCreate?.label ?? ""}
        placeholder={simpleCreate?.placeholder ?? ""}
        submitLabel="Создать"
        onClose={onClose}
        onSubmit={(title) => {
          if (state?.type !== "create" || !simpleCreate) return;
          // Folders exist only at the root: no nesting in the MVP.
          if (state.kind === "folder") store.createFolder(title, null);
          else store.createLesson(title, { folderId });
          toast(simpleCreate.done);
        }}
      />

      <CreateTextbookDialog
        open={state?.type === "create" && state.kind === "textbook"}
        onClose={onClose}
        onCreate={(input) => onTextbookCreated?.(store.createTextbook(input, folderId))}
      />

      <PromptDialog
        open={state?.type === "rename"}
        title={state?.type === "rename" ? `Переименовать ${kindNoun[state.target.kind]}` : ""}
        label="Название"
        initialValue={state?.type === "rename" ? state.target.title : ""}
        submitLabel="Сохранить"
        onClose={onClose}
        onSubmit={(title) => {
          if (state?.type !== "rename") return;
          const { target } = state;
          if (target.kind === "folder") store.renameFolder(target.id, title);
          else store.renameMaterial(target.kind, target.id, title);
          toast("Название обновлено");
        }}
      />

      <ConfirmDialog
        open={state?.type === "delete"}
        title={
          state?.type !== "delete" ? "" : state.target.kind === "folder" ? "Удалить папку?" : `Удалить «${state.target.title}»?`
        }
        description={
          state?.type !== "delete"
            ? undefined
            : state.target.kind === "folder"
              ? "Папка будет удалена, а находящиеся в ней материалы автоматически переместятся в раздел „Библиотека“."
              : deleteDescription(store.data, state.target.kind, state.target.id)
        }
        confirmLabel={state?.type === "delete" && state.target.kind === "folder" ? "Удалить папку" : "Удалить"}
        onClose={onClose}
        onConfirm={() => {
          if (state?.type !== "delete") return;
          const { target } = state;
          const result =
            target.kind === "folder" ? store.deleteFolder(target.id) : store.deleteMaterial(target.kind, target.id);
          if (!result.ok) return;
          toast(target.kind === "folder" ? "Папка удалена" : "Удалено");
          onDeleted?.(target);
        }}
      />

      <NoticeDialog
        open={state?.type === "blocked"}
        title={state?.type === "blocked" ? (state.title ?? blockMessages[state.reason].title) : ""}
        description={state?.type === "blocked" ? (state.description ?? blockMessages[state.reason].description) : ""}
        onClose={onClose}
      />

      <MoveDialog state={state} onClose={onClose} />

      <MoveToTextbookDialog state={state} onClose={onClose} />

      <ShareDialog open={state?.type === "share"} onClose={onClose} target={state?.type === "share" ? state.target : null} />
    </>
  );
}

function MoveDialog({ state, onClose }: { state: DialogState; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const moveMaterial = useStore((s) => s.moveMaterial);
  const open = state?.type === "move";
  const target = open ? state.target : null;
  const currentFolderId = target
    ? ((target.kind === "lesson"
        ? data.lessons.find((l) => l.id === target.id)?.folderId
        : data.textbooks.find((t) => t.id === target.id)?.folderId) ?? null)
    : null;

  // Depth-first list of folders, indented by depth.
  const options: { id: string | null; name: string; depth: number }[] = [{ id: null, name: "Библиотека", depth: 0 }];
  const walk = (parentId: string | null, depth: number) => {
    data.folders
      .filter((f) => f.parentFolderId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
      .forEach((f) => {
        options.push({ id: f.id, name: f.name, depth });
        walk(f.id, depth + 1);
      });
  };
  walk(null, 1);

  const move = (folderId: string | null, name: string) => {
    if (!target) return;
    moveMaterial(target.kind, target.id, folderId);
    toast(folderId ? `Перенесено в «${name}»` : "Перенесено в «Библиотеку»");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={target ? `Переместить «${target.title}»` : ""}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
      }
    >
      <ul className="-mx-2 mt-2 max-h-80 overflow-y-auto">
        {options.map((option) => {
          const isCurrent = option.id === currentFolderId;
          const path = folderPath(data, option.id).map((f) => f.name).join(" / ");
          return (
            <li key={option.id ?? "root"}>
              <button
                type="button"
                disabled={isCurrent}
                onClick={() => move(option.id, option.name)}
                title={path || "Библиотека"}
                style={{ paddingLeft: 8 + option.depth * 20 }}
                className="flex w-full items-center gap-2.5 rounded-sm py-2 pr-2 text-left text-ink transition-colors duration-[120ms] hover:bg-hover disabled:bg-selected"
              >
                {option.id ? (
                  <FolderIcon size={18} strokeWidth={1.75} className="text-ink-secondary" aria-hidden />
                ) : (
                  <LibraryBig size={18} strokeWidth={1.75} className="text-ink-secondary" aria-hidden />
                )}
                <span className="flex-1 font-medium">{option.name}</span>
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
    </Dialog>
  );
}

const optionClass =
  "flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left text-ink transition-colors duration-[120ms] hover:bg-hover disabled:hover:bg-transparent";

/** «Переместить в учебник»: pick a textbook, then a section if it has them. The lesson goes to the end. */
function MoveToTextbookDialog({ state, onClose }: { state: DialogState; onClose: () => void }) {
  const open = state?.type === "moveToTextbook";
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={open ? `Переместить «${state.target.title}»` : ""}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
      }
    >
      {/* Remount per open so it starts from the list of textbooks. */}
      {open && <TextbookPicker lessonId={state.target.id} onClose={onClose} />}
    </Dialog>
  );
}

function TextbookPicker({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const data = useStore((s) => s.data);
  const moveLessonToTextbook = useStore((s) => s.moveLessonToTextbook);
  const [picked, setPicked] = useState<string | null>(null);
  const currentId = data.lessons.find((l) => l.id === lessonId)?.textbookId ?? null;
  const textbooks = [...data.textbooks].sort((a, b) => a.title.localeCompare(b.title, "ru"));
  const textbook = textbooks.find((t) => t.id === picked);

  const move = (textbookId: string, sectionId: string | null, name: string) => {
    moveLessonToTextbook(lessonId, textbookId, sectionId);
    toast(`Урок перенесён в «${name}»`);
    onClose();
  };

  if (textbook) {
    const sections = [...textbook.sections].sort((a, b) => a.order - b.order);
    return (
      <div className="mt-2">
        <button type="button" onClick={() => setPicked(null)} className={`${optionClass} -mx-2 font-semibold`}>
          <ArrowLeft size={18} strokeWidth={1.75} className="text-ink-secondary" aria-hidden />
          {textbook.title}
        </button>
        <ul className="-mx-2 mt-1 max-h-80 overflow-y-auto">
          {sections.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => move(textbook.id, s.id, s.title)} className={`${optionClass} pl-9 font-medium`}>
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ul className="-mx-2 mt-2 max-h-80 overflow-y-auto">
      {textbooks.map((t) => {
        const isCurrent = t.id === currentId;
        // Sections on but none yet: there's nowhere to put the lesson.
        const noSections = t.useSections && t.sections.length === 0;
        return (
          <li key={t.id}>
            <button
              type="button"
              disabled={isCurrent || noSections}
              onClick={() => (t.useSections ? setPicked(t.id) : move(t.id, null, t.title))}
              className={`${optionClass} ${isCurrent ? "bg-selected disabled:hover:bg-selected" : ""} ${noSections ? "text-ink-secondary" : ""}`}
            >
              <BookOpen size={18} strokeWidth={1.75} className="text-ink-secondary" aria-hidden />
              <span className="flex-1 font-medium">{t.title}</span>
              {isCurrent ? (
                <span className="flex items-center gap-1 text-caption text-action">
                  <Check size={14} strokeWidth={2} aria-hidden /> Сейчас здесь
                </span>
              ) : noSections ? (
                <span className="text-caption">Нет разделов</span>
              ) : (
                t.useSections && <ChevronRight size={18} strokeWidth={1.75} className="text-ink-secondary" aria-hidden />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
