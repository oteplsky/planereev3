import { PLANEREE } from "@/lib/catalog";
import { avatarBg } from "@/lib/learners";
import type { AccentColor, Author } from "@/lib/types";

const colors = Object.keys(avatarBg) as AccentColor[];

/** The same author always gets the same colour. */
function colorFor(id: string): AccentColor {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** The «P» with the lime dot from the logo, on its own. */
function PlanereeMark() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-light">
      <svg viewBox="22 22 98 102" className="size-3" aria-hidden>
        <path
          d="M 35.5263 111.3158 L 35.5263 66.0526 C 35.5263 47.1053 49.2105 35.5263 68.1579 35.5263 C 88.1579 35.5263 102.8947 49.2105 102.8947 67.1053 C 102.8947 86.0526 88.1579 97.6316 69.2105 97.6316 L 66.0526 97.6316"
          fill="none"
          stroke="#0866F5"
          strokeWidth="21"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="102.89" cy="111.32" r="10.53" fill="#DDFB78" />
      </svg>
    </span>
  );
}

/**
 * Who made a material, on cards: an avatar before the name says «author» without a word —
 * Russian has no «by» that works without declining the name.
 */
export function AuthorCaption({ author }: { author: Author }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {author.id === PLANEREE.id ? (
        <PlanereeMark />
      ) : (
        <span
          className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] leading-none font-bold text-ink ${avatarBg[colorFor(author.id)]}`}
          aria-hidden
        >
          {initials(author.name)}
        </span>
      )}
      <span className="truncate">
        <span className="sr-only">Автор: </span>
        {author.name}
      </span>
    </span>
  );
}
