"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Camera, Check, Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton, TextButton } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { contextHref } from "@/lib/context";
import { groupsOf } from "@/lib/learners";
import { useStore } from "@/lib/store";
import type { Learner } from "@/lib/types";

/**
 * Lesson context on a student's page. «Индивидуально» is the current context — selected, not a
 * control — so «Начать индивидуальный урок» reads unambiguously. Group chips open the group,
 * where lessons are for the whole group. Group membership never hides the individual context.
 */
export function FormatChips({ learner }: { learner: Learner }) {
  const data = useStore((s) => s.data);
  const groups = groupsOf(data, learner.id);
  const chip = "inline-flex h-7 items-center gap-1 rounded-full border px-3 text-caption font-semibold";
  return (
    <span className="flex flex-wrap gap-1.5">
      <span aria-current="page" className={`${chip} border-action bg-selected pl-2 text-action`}>
        <Check size={14} strokeWidth={2.5} aria-hidden />
        Индивидуально
      </span>
      {groups.map((g) => (
        <Link
          key={g.id}
          href={contextHref("/library", g.id)}
          className={`${chip} border-line bg-surface text-ink transition-colors duration-[120ms] hover:border-line-strong hover:bg-hover`}
        >
          {g.name}
        </Link>
      ))}
    </span>
  );
}

/**
 * Student profile (spec §5). Avatar picking, email and notes are local to this view:
 * nothing is uploaded or saved yet. Schedule and balance are placeholders for the CRM.
 */
export function LearnerProfile({ learner, open, onClose }: { learner: Learner; open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title={`Профиль: ${learner.name}`}>
      {/* Remount per learner so local edits don't leak between profiles. */}
      <ProfileBody key={learner.id} learner={learner} />
    </Drawer>
  );
}

function ProfileBody({ learner }: { learner: Learner }) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col items-center gap-3 text-center">
        <AvatarPicker learner={learner} />
        <div>
          <p className="text-h2">{learner.name}</p>
          <div className="mt-2 flex justify-center">
            <FormatChips learner={learner} />
          </div>
        </div>
      </div>

      <Field label="Email">
        <EmailField initial={learner.email ?? ""} />
        {learner.invitePending && <TextButton className="mt-2">Отправить приглашение</TextButton>}
      </Field>

      {learner.schedule && learner.schedule.length > 0 && (
        <Field label="Расписание">
          <ul className="flex flex-col gap-2">
            {learner.schedule.map((slot) => (
              <li key={slot} className="flex items-center gap-2.5">
                <CalendarDays size={18} strokeWidth={1.75} className="text-ink-secondary" aria-hidden />
                {slot}
              </li>
            ))}
          </ul>
        </Field>
      )}

      {learner.lessonsLeft !== undefined && (
        <Field label="Баланс">
          <p>
            Осталось занятий: <span className="font-bold">{learner.lessonsLeft}</span>
          </p>
        </Field>
      )}

      <TextButton>Правила</TextButton>

      <Field label="Заметки" htmlFor={`notes-${learner.id}`}>
        <textarea
          id={`notes-${learner.id}`}
          rows={4}
          className="w-full resize-y rounded-sm border border-line-strong bg-surface px-3 py-2.5 outline-none placeholder:text-neutral-400 focus:border-action"
        />
      </Field>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  const labelClass = "mb-2 block text-caption font-bold tracking-wider text-ink-secondary uppercase";
  return (
    <section>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
        </label>
      ) : (
        <h3 className={labelClass}>{label}</h3>
      )}
      {children}
    </section>
  );
}

/** Hover shows a camera: the avatar can be changed. The picked image is only previewed. */
function AvatarPicker({ learner }: { learner: Learner }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Изменить фото"
        className="group relative rounded-full"
      >
        <Avatar learner={learner} size="profile" src={preview} />
        <span className="absolute inset-0 grid place-items-center rounded-full bg-neutral-950/45 text-white opacity-0 transition-opacity duration-[120ms] group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera size={26} strokeWidth={1.75} aria-hidden />
        </span>
        <span className="absolute right-0 bottom-0 grid size-8 place-items-center rounded-full border-2 border-surface bg-action text-white">
          <Pencil size={14} strokeWidth={2} aria-hidden />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setPreview(URL.createObjectURL(file));
          e.target.value = "";
        }}
      />
    </>
  );
}

/** Read mode with a pencil; edit mode is a field. Enter or ✓ applies, Escape cancels. */
function EmailField({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className={`min-w-0 flex-1 truncate ${value ? "" : "text-ink-secondary"}`}>{value || "Не указан"}</span>
        <IconButton
          label="Изменить email"
          size="sm"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
        >
          <Pencil size={18} strokeWidth={1.75} />
        </IconButton>
      </div>
    );
  }

  const apply = () => {
    setValue(draft.trim());
    setEditing(false);
  };
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <input
        type="email"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setEditing(false);
          }
        }}
        aria-label="Email"
        autoFocus
        className="h-10 min-w-0 flex-1 rounded-sm border border-action bg-surface px-3 outline-none"
      />
      <IconButton label="Сохранить email" size="sm" type="submit">
        <Check size={18} strokeWidth={2} />
      </IconButton>
    </form>
  );
}
