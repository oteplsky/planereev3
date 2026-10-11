"use client";

import { Check, Folder as FolderIcon, LibraryBig } from "lucide-react";
import { CreateTextbookDialog } from "@/components/textbook/CreateTextbookDialog";
import { ConfirmDialog, Dialog, NoticeDialog, PromptDialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { deleteBlockReason, folderPath } from "@/lib/domain";
import { blockMessages } from "@/lib/messages";
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
  | { type: "move"; target: Target & { kind: "lesson" | "textbook" } };

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
              : state.target.kind === "textbook"
                ? "Учебник удалится вместе со всеми уроками. Это действие нельзя отменить."
                : "Это действие нельзя отменить."
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
