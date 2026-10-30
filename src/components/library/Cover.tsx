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

// Pages behind a textbook cover: the same hue, fading back.
const pageBg: Record<AccentColor, [back: string, middle: string]> = {
  pink: ["bg-pink-softest", "bg-pink-bg"], coral: ["bg-coral-softest", "bg-coral-bg"],
  orange: ["bg-orange-softest", "bg-orange-bg"], yellow: ["bg-yellow-softest", "bg-yellow-bg"],
  green: ["bg-green-softest", "bg-green-bg"], teal: ["bg-teal-softest", "bg-teal-bg"],
  blue: ["bg-blue-softest", "bg-blue-bg"], violet: ["bg-violet-softest", "bg-violet-bg"],
};

/** Two pages peeking above a textbook card, so it reads as a stack. Parent needs `relative pt-4`. */
export function StackPages({ cover }: { cover: AccentColor | null }) {
  const [back, middle] = cover ? pageBg[cover] : ["bg-neutral-100", "bg-neutral-200"];
  return (
    <>
      <span aria-hidden className={`absolute inset-x-6 top-0 h-6 rounded-t-lg ${back}`} />
      <span aria-hidden className={`absolute inset-x-3 top-2 h-6 rounded-t-lg ${middle}`} />
    </>
  );
}

interface CoverProps {
  cover: AccentColor | null;
  kind: "lesson" | "textbook";
  /** Uploaded picture; replaces the generated cover. */
  image?: string | null;
}

/**
 * Card cover. With a colour: the brand ribbon with the lime dot (brand · Изображения).
 * Without: a quiet placeholder with the material's icon.
 */
export function Cover({ cover, kind, image }: CoverProps) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing to optimise
      <img src={image} alt="" className="block aspect-[3/4] w-full rounded-t-lg object-cover" />
    );
  }
  if (!cover) {
    const Icon = kind === "textbook" ? BookOpen : FileText;
    return (
      <div className="m-1.5 mb-0 grid aspect-[3/4] place-items-center rounded-md border border-dashed border-line-strong bg-light text-ink-secondary">
        <Icon size={28} strokeWidth={1.5} aria-hidden />
      </div>
    );
  }

  return (
    <div className={`relative aspect-[3/4] overflow-hidden rounded-t-lg ${coverBg[cover]}`} aria-hidden>
      <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <path
          d="M-20 290 C 60 220, 120 350, 200 280 S 290 200, 330 235"
          fill="none"
          strokeWidth="26"
          strokeLinecap="round"
          className={ribbonSoft[cover]}
          stroke="currentColor"
        />
        <path
          d="M-20 150 C 60 80, 130 220, 205 145 S 295 70, 330 100"
          fill="none"
          strokeWidth="26"
          strokeLinecap="round"
          className={ribbonStrong[cover]}
          stroke="currentColor"
        />
      </svg>
      <span className="absolute right-[14%] bottom-[10%] aspect-square w-[13%] rounded-full bg-lime" />
      {kind === "textbook" && (
        <span className="absolute inset-y-0 left-0 w-2.5 bg-neutral-950/10" />
      )}
    </div>
  );
}
