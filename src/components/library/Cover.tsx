import { BookOpen, FileText } from "lucide-react";
import type { AccentColor } from "@/lib/types";

// Static class maps so Tailwind can see every class name.
const coverBg: Record<AccentColor, string> = {
  pink: "bg-pink-lighter", coral: "bg-coral-lighter", orange: "bg-orange-lighter",
  yellow: "bg-yellow-lighter", green: "bg-green-lighter", teal: "bg-teal-lighter",
  blue: "bg-blue-lighter", violet: "bg-violet-lighter",
};
const ribbonStrong: Record<AccentColor, string> = {
  pink: "text-pink", coral: "text-coral", orange: "text-orange", yellow: "text-yellow",
  green: "text-green", teal: "text-teal", blue: "text-blue", violet: "text-violet",
};
const ribbonSoft: Record<AccentColor, string> = {
  pink: "text-pink-bg", coral: "text-coral-bg", orange: "text-orange-bg", yellow: "text-yellow-bg",
  green: "text-green-bg", teal: "text-teal-bg", blue: "text-blue-bg", violet: "text-violet-bg",
};

interface CoverProps {
  cover: AccentColor | null;
  kind: "lesson" | "textbook";
}

/**
 * Card cover. With a colour: the brand ribbon with the lime dot (brand · Изображения).
 * Without: a quiet placeholder, as in the previous build.
 */
export function Cover({ cover, kind }: CoverProps) {
  if (!cover) {
    const Icon = kind === "textbook" ? BookOpen : FileText;
    return (
      <div className="m-1.5 mb-0 grid aspect-[16/10] place-items-center rounded-md border border-dashed border-line-strong bg-light text-ink-secondary">
        <div className="flex flex-col items-center gap-2">
          <Icon size={28} strokeWidth={1.5} aria-hidden />
          <span className="text-caption">Нет обложки</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-[16/10] overflow-hidden rounded-t-lg ${coverBg[cover]}`} aria-hidden>
      <svg viewBox="0 0 320 200" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path
          d="M-10 150 C 60 90, 120 190, 190 130 S 290 60, 340 100"
          fill="none"
          strokeWidth="22"
          strokeLinecap="round"
          className={ribbonSoft[cover]}
          stroke="currentColor"
        />
        <path
          d="M-10 70 C 70 20, 130 120, 200 70 S 300 10, 340 40"
          fill="none"
          strokeWidth="22"
          strokeLinecap="round"
          className={ribbonStrong[cover]}
          stroke="currentColor"
        />
      </svg>
      <span className="absolute right-[12%] bottom-[14%] aspect-square w-[11%] rounded-full bg-lime" />
      {kind === "textbook" && (
        <span className="absolute inset-y-0 left-0 w-2.5 bg-neutral-950/10" />
      )}
    </div>
  );
}
