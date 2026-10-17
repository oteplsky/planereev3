"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { StatusChip } from "@/components/ui/Badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { contextHref } from "@/lib/context";
import { textbookFromCatalog } from "@/lib/domain";
import { forLearner } from "@/lib/learners";
import { useStore } from "@/lib/store";
import type { Learner } from "@/lib/types";

/**
 * «Добавить в библиотеку», or — once added — where the teacher's copy is.
 * Coming from a learner, «Открыть» goes straight back to that learner's view of the textbook.
 */
export function AddToLibrary({ catalogTextbookId, from }: { catalogTextbookId: string; from: Learner | null }) {
  const router = useRouter();
  const copy = useStore((s) => textbookFromCatalog(s.data, catalogTextbookId));
  const add = useStore((s) => s.addTextbookFromCatalog);
  const openLabel = from ? `Открыть ${forLearner(from)}` : "Открыть в библиотеке";
  const openHref = (textbookId: string) => contextHref(`/textbook/${textbookId}`, from?.id ?? null);

  if (copy) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <InLibraryChip />
        <Link href={openHref(copy.id)} className={buttonClass("secondary")}>
          {openLabel}
        </Link>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      icon={<Plus size={20} strokeWidth={1.75} aria-hidden />}
      onClick={() => {
        const id = add(catalogTextbookId);
        if (!id) return;
        toast("Добавлено в библиотеку", { label: from ? openLabel : "Открыть", onClick: () => router.push(openHref(id)) });
      }}
    >
      Добавить в библиотеку
    </Button>
  );
}

export function InLibraryChip() {
  return (
    <StatusChip icon={<Check size={14} strokeWidth={2.5} className="ml-0.5 text-green-darker" aria-hidden />}>
      В библиотеке
    </StatusChip>
  );
}
