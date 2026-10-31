"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextArea, TextField } from "@/components/ui/Field";
import { emptyMeta, isMetaComplete } from "@/lib/meta";
import type { NewTextbook } from "@/lib/domain";
import { MetaFields } from "./MetaFields";

interface TextbookDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewTextbook) => void;
  /** The saved details: «Настройки учебника». Without it the dialog creates a new textbook. */
  initial?: NewTextbook;
}

const blank: NewTextbook = { title: "", description: "", meta: emptyMeta };

/** One form for a textbook's title, description and metadata, both when it's created and later. */
export function TextbookDetailsDialog({ open, onClose, onSubmit, initial }: TextbookDetailsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={initial ? "Настройки учебника" : "Новый учебник"}>
      {/* Remount per open so the form starts from the saved (or empty) details. */}
      {open && <DetailsForm onClose={onClose} onSubmit={onSubmit} initial={initial} />}
    </Dialog>
  );
}

function DetailsForm({ onClose, onSubmit, initial }: Omit<TextbookDetailsDialogProps, "open">) {
  const start = initial ?? blank;
  const [title, setTitle] = useState(start.title);
  const [description, setDescription] = useState(start.description);
  const [meta, setMeta] = useState(start.meta);
  const valid = title.trim() !== "" && isMetaComplete(meta);

  return (
    <form
      className="mt-2 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({ title, description, meta });
        onClose();
      }}
    >
      <TextField
        label="Название учебника"
        required
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Например, English File A2"
      />
      <TextArea
        label="Описание"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={500}
        rows={3}
      />
      <MetaFields meta={meta} onChange={setMeta} showErrors={!!initial} />
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" variant="primary" disabled={!valid}>
          {initial ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
