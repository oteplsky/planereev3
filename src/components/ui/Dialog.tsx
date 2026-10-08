"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "./Button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
}

/**
 * UI kit · Оверлеи: modal for a short, complete task. Native <dialog> gives
 * focus containment and Escape-to-close; focus returns to the opener on close.
 */
export function Dialog({ open, onClose, title, children, footer, icon }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby={titleId}
      className="m-auto w-[min(92vw,480px)] rounded-lg bg-surface p-0 text-ink shadow-3 backdrop:bg-neutral-950/40"
    >
      {open && (
        <div className="p-6">
          <div className="flex gap-3">
            {icon}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-h3">
                {title}
              </h2>
              {children && <div className="mt-2 text-ink-secondary">{children}</div>}
            </div>
          </div>
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Destructive confirmation: «Удалить урок?» · «Это действие нельзя отменить.» */
export function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      icon={
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-danger-bg text-ink">
          <AlertTriangle size={18} strokeWidth={1.75} />
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} autoFocus>
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description}
    </Dialog>
  );
}

interface NoticeDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  onClose: () => void;
}

/** Explains why an action isn't available, instead of failing silently. */
export function NoticeDialog({ open, title, description, onClose }: NoticeDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      icon={
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-info text-white">
          <Info size={18} strokeWidth={1.75} />
        </span>
      }
      footer={
        <Button variant="primary" onClick={onClose} autoFocus>
          Понятно
        </Button>
      }
    >
      {description}
    </Dialog>
  );
}

interface PromptDialogProps {
  open: boolean;
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

/** Single-field form: create or rename something. */
export function PromptDialog(props: PromptDialogProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} title={props.title}>
      {/* Remount per open so the field starts from initialValue. */}
      {props.open && <PromptForm {...props} />}
    </Dialog>
  );
}

function PromptForm({ label, initialValue = "", placeholder, submitLabel, onSubmit, onClose }: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();

  return (
    <form
      className="mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!trimmed) return;
        onSubmit(trimmed);
        onClose();
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-body font-semibold text-ink">{label}</span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          placeholder={placeholder}
          maxLength={120}
          className="h-10 w-full rounded-sm border border-line-strong bg-surface px-3 text-ink outline-none transition-colors placeholder:text-neutral-400 focus:border-action focus:ring-3 focus:ring-action/15"
        />
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" variant="primary" disabled={!trimmed}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
