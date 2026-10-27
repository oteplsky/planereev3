"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useStore, type PrototypeSettings, type Scenario } from "@/lib/store";

const scenarios: { value: Scenario; title: string; caption: string }[] = [
  { value: "demo", title: "Демо", caption: "Ученики, группы, материалы" },
  { value: "empty", title: "Новый преподаватель", caption: "Без учеников и материалов" },
];

/** Step before the prototype: pick the data it starts from. */
export function PrototypeLauncher() {
  const router = useRouter();
  const current = useStore((s) => s.prototype);
  const startPrototype = useStore((s) => s.startPrototype);
  const [picked, setPicked] = useState<PrototypeSettings>(current);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-8">
      <h1 className="text-h1">Прототип</h1>
      <OptionGroup label="Данные">
        {scenarios.map((s) => (
          <Option
            key={s.value}
            selected={picked.scenario === s.value}
            onSelect={() => setPicked({ scenario: s.value })}
            title={s.title}
            caption={s.caption}
          />
        ))}
      </OptionGroup>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            startPrototype(picked);
            router.push("/library");
          }}
        >
          Открыть
        </Button>
        <Link href="/library" className="px-3 font-semibold text-ink-secondary hover:text-ink">
          Продолжить с текущими данными
        </Link>
      </div>
    </div>
  );
}

function OptionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-caption font-bold tracking-wider text-ink-secondary uppercase">{label}</legend>
      <div role="radiogroup" aria-label={label} className="grid gap-3 sm:grid-cols-2">
        {children}
      </div>
    </fieldset>
  );
}

function Option({ selected, onSelect, title, caption }: { selected: boolean; onSelect: () => void; title: string; caption: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors duration-[120ms] ${
        selected ? "border-action bg-selected" : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <span className="font-bold">{title}</span>
      <span className="text-caption text-ink-secondary">{caption}</span>
      {selected && <Check size={18} strokeWidth={2.25} className="absolute top-4 right-4 text-action" aria-hidden />}
    </button>
  );
}

/** Corner badge on every screen: which data is open, and the way back to the launcher. */
export function PrototypeBadge() {
  const hydrated = useStore((s) => s.hydrated);
  const { scenario } = useStore((s) => s.prototype);
  const onLauncher = usePathname() === "/prototype";
  if (!hydrated || onLauncher) return null;
  return (
    <Link
      href="/prototype"
      className="fixed right-4 bottom-4 z-40 rounded-full border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-ink-secondary shadow-1 transition-colors duration-[120ms] hover:text-ink"
    >
      {scenarios.find((s) => s.value === scenario)?.title}
    </Link>
  );
}
