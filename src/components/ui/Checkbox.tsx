import { Check } from "lucide-react";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** UI kit · Чекбокс: native input for keyboard and screen readers, drawn as a 20px box. */
export function Checkbox({ label, checked, onChange, disabled = false }: CheckboxProps) {
  return (
    <label
      className={`flex h-10 items-center gap-2 rounded-sm px-2 font-medium transition-colors duration-[120ms] ${disabled ? "cursor-default" : "cursor-pointer hover:bg-hover"}`}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden
        className={`grid size-5 shrink-0 place-items-center rounded-xs border-2 transition-colors duration-[120ms] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
          checked ? "border-action bg-action text-white" : "border-line-strong bg-surface"
        } ${disabled ? "opacity-60" : ""}`}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
}
