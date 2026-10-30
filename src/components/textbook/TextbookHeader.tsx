"use client";

import { useRef, useState } from "react";
import { Camera, Copy, Ellipsis, FolderInput, Share2, Trash2, X } from "lucide-react";
import { AuthorLine } from "@/components/library/AuthorLine";
import type { CardActions } from "@/components/library/Cards";
import { Cover } from "@/components/library/Cover";
import { IconButton } from "@/components/ui/Button";
import { Menu } from "@/components/ui/Menu";
import { Progress } from "@/components/ui/Progress";
import { toast } from "@/components/ui/Toast";
import type { TextbookProgress } from "@/lib/domain";
import { metaSummary } from "@/lib/meta";
import { useStore } from "@/lib/store";
import type { Textbook } from "@/lib/types";
import { MetaFields } from "./MetaFields";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

interface TextbookHeaderProps {
  textbook: Textbook;
  editable: boolean;
  /** «Поделиться»; empty when the textbook has anything of someone else's. */
  share: Pick<CardActions, "onShare">;
  onMove: () => void;
  onDelete: () => void;
  /** In a learner context: how far the learner has got. */
  progress?: TextbookProgress | null;
}

/** Cover, title, description and metadata. In the global context every field is edited in place and saved at once. */
export function TextbookHeader({ textbook, editable, share, onMove, onDelete, progress }: TextbookHeaderProps) {
  const duplicateMaterial = useStore((s) => s.duplicateMaterial);
  const updateTextbookDetails = useStore((s) => s.updateTextbookDetails);

  if (!editable) {
    const summary = metaSummary(textbook.meta);
    return (
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="w-40 shrink-0 overflow-hidden rounded-lg border border-line sm:w-48">
          <Cover cover={textbook.cover} kind="textbook" image={textbook.coverImage} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-h1">{textbook.title}</h1>
          <AuthorLine author={textbook.author} className="mt-2" />
          {summary && <p className="mt-2 font-semibold text-ink-secondary">{summary}</p>}
          {textbook.description && <p className="mt-3 max-w-2xl whitespace-pre-line">{textbook.description}</p>}
          {progress && <Progress value={progress.completed} total={progress.total} className="mt-4 max-w-xs" />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <CoverEditor textbook={textbook} />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-start gap-3">
          {/* Remount on outside changes so the draft starts from the saved value. */}
          <TitleField key={textbook.title} textbook={textbook} />
          <Menu
            items={[
              ...(share.onShare
                ? [{ label: "Поделиться", icon: <Share2 {...iconProps} />, onSelect: share.onShare }]
                : []),
              {
                label: "Создать копию",
                icon: <Copy {...iconProps} />,
                onSelect: () => {
                  duplicateMaterial("textbook", textbook.id);
                  toast("Копия учебника создана");
                },
              },
              { label: "Переместить в папку", icon: <FolderInput {...iconProps} />, onSelect: onMove },
              { label: "Удалить", icon: <Trash2 {...iconProps} />, danger: true, onSelect: onDelete },
            ]}
            trigger={(props) => (
              <IconButton {...props} label={`Действия: ${textbook.title}`} className="mt-1">
                <Ellipsis size={20} strokeWidth={1.75} />
              </IconButton>
            )}
          />
        </div>
        <AuthorLine author={textbook.author} className="-mt-2" />
        <DescriptionField key={textbook.description} textbook={textbook} />
        <MetaFields
          meta={textbook.meta}
          onChange={(meta) => updateTextbookDetails(textbook.id, { meta })}
          showErrors
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        />
      </div>
    </div>
  );
}

const inlineField =
  "w-full rounded-sm border border-transparent bg-transparent px-2 -mx-2 outline-none transition-colors duration-[120ms] hover:border-line-strong focus:border-action focus:bg-surface focus:ring-3 focus:ring-action/15";

/** «Название учебника» is required: an emptied title isn't saved and goes back to the last one on blur. */
function TitleField({ textbook }: { textbook: Textbook }) {
  const updateTextbookDetails = useStore((s) => s.updateTextbookDetails);
  const [draft, setDraft] = useState(textbook.title);
  const empty = draft.trim() === "";

  const commit = () => {
    if (empty) setDraft(textbook.title);
    else if (draft.trim() !== textbook.title) updateTextbookDetails(textbook.id, { title: draft });
  };

  return (
    <div className="min-w-0 flex-1">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(textbook.title);
            requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
          }
        }}
        aria-label="Название учебника"
        aria-invalid={empty || undefined}
        aria-describedby={empty ? "textbook-title-error" : undefined}
        maxLength={120}
        className={`h-12 text-h1 ${inlineField} ${empty ? "border-danger-hover hover:border-danger-hover focus:border-danger-hover" : ""}`}
      />
      {empty && (
        <p id="textbook-title-error" className="mt-1 text-caption text-danger-hover">
          Введите название учебника
        </p>
      )}
    </div>
  );
}

function DescriptionField({ textbook }: { textbook: Textbook }) {
  const updateTextbookDetails = useStore((s) => s.updateTextbookDetails);
  const [draft, setDraft] = useState(textbook.description);
  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft.trim() !== textbook.description && updateTextbookDetails(textbook.id, { description: draft })}
      aria-label="Описание"
      placeholder="Описание"
      maxLength={500}
      rows={1}
      className={`field-sizing-content min-h-10 max-w-3xl resize-none py-2 ${inlineField} placeholder:text-neutral-400`}
    />
  );
}

/** Downscales the picked image so a cover stays small enough for localStorage. */
async function readCover(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 800 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

function CoverEditor({ textbook }: { textbook: Textbook }) {
  const setTextbookCoverImage = useStore((s) => s.setTextbookCoverImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCover = !!(textbook.coverImage || textbook.cover);
  const pick = () => inputRef.current?.click();

  return (
    <div className="relative w-48 shrink-0 sm:w-56">
      <button
        type="button"
        onClick={pick}
        aria-label={hasCover ? "Заменить обложку" : "Загрузить обложку"}
        className="group relative block w-full overflow-hidden rounded-lg border border-line"
      >
        <Cover cover={textbook.cover} kind="textbook" image={textbook.coverImage} />
        <span className="absolute inset-0 grid place-items-center bg-neutral-950/45 text-white opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera size={26} strokeWidth={1.75} aria-hidden />
        </span>
      </button>
      {/* Uploading and replacing happen on the cover itself; removal is the × in its corner. */}
      {hasCover && (
        <div className="group/remove absolute top-2 right-2">
          <button
            type="button"
            aria-label="Удалить обложку"
            onClick={() => {
              setTextbookCoverImage(textbook.id, null);
              toast("Обложка удалена");
            }}
            className="grid size-8 place-items-center rounded-full bg-surface/90 text-ink shadow-1 transition-colors duration-[120ms] hover:bg-surface hover:text-danger-hover"
          >
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute top-full right-0 z-30 mt-2 w-max rounded-sm bg-neutral-900 px-3 py-2 text-caption text-white opacity-0 shadow-2 transition-opacity duration-[120ms] group-focus-within/remove:opacity-100 group-hover/remove:opacity-100"
          >
            Удалить обложку
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            setTextbookCoverImage(textbook.id, await readCover(file));
            toast(hasCover ? "Обложка заменена" : "Обложка загружена");
          } catch {
            toast("Не удалось открыть изображение");
          }
        }}
      />
    </div>
  );
}
