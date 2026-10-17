import Link from "next/link";
import { PLANEREE } from "@/lib/catalog";
import type { Author } from "@/lib/types";

/**
 * «Автор: Planeree» on a textbook page. Planeree links to the catalog; other authors get
 * public profile links once teachers can publish. Null = the teacher themselves.
 */
export function AuthorLine({ author, className = "" }: { author: Author | null; className?: string }) {
  return (
    <p className={`text-body text-ink-secondary ${className}`}>
      Автор:{" "}
      {author?.id === PLANEREE.id ? (
        <Link href="/catalog" className="rounded-xs font-semibold text-action underline-offset-4 hover:text-action-hover hover:underline">
          {author.name}
        </Link>
      ) : (
        <span className="font-semibold text-ink">{author ? author.name : "Вы"}</span>
      )}
    </p>
  );
}
