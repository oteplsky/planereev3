"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextArea, TextField } from "@/components/ui/Field";
import { emptyMeta, isMetaComplete, type MaterialMeta } from "@/lib/meta";
import type { NewTextbook } from "@/lib/domain";
import { MetaFields } from "./MetaFields";

interface CreateTextbookDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (input: NewTextbook) => void;
}

export function CreateTextbookDialog({ open, onClose, onCreate }: CreateTextbookDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Новый учебник">
      {/* Remount per open so every creation starts from an empty form. */}
      {open && <CreateTextbookForm onClose={onClose} onCreate={onCreate} />}
    </Dialog>
  );
}

function CreateTextbookForm({ onClose, onCreate }: Omit<CreateTextbookDialogProps, "open">) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meta, setMeta] = useState<MaterialMeta>(emptyMeta);
  const valid = title.trim() !== "" && isMetaComplete(meta);

  return (
    <form
      className="mt-2 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onCreate({ title, description, meta });
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
      <MetaFields meta={meta} onChange={setMeta} />
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" variant="primary" disabled={!valid}>
          Создать
        </Button>
      </div>
    </form>
  );
}
