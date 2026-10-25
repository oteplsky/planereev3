"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchX } from "lucide-react";
import { InLibraryChip } from "@/components/catalog/AddToLibrary";
import { MaterialCard } from "@/components/library/Cards";
import { SectionLabel } from "@/components/library/Library";
import { MetaFilterBar, useMetaFilters } from "@/components/library/MetaFilterBar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchField } from "@/components/ui/SearchField";
import { catalog } from "@/lib/catalog";
import { catalogHref, contextHref, useReturnLearner } from "@/lib/context";
import { searchMaterials, textbookFromCatalog, textbookLessonCount } from "@/lib/domain";
import { AGE_GROUPS, hasActiveFilters, levelLabels, SUBJECTS, type Level, type MetaFilters } from "@/lib/meta";
import { useStore, useVariant } from "@/lib/store";

/** Filters handed over from a library search (`?q=…&subject=…`); unknown values are ignored. */
function filtersFromParams(params: URLSearchParams): MetaFilters {
  const pick = <T extends string>(key: string, allowed: readonly T[]) => {
    const value = params.get(key);
    return allowed.includes(value as T) ? (value as T) : null;
  };
  return {
    subject: pick("subject", SUBJECTS),
    ageGroup: pick("ageGroup", AGE_GROUPS),
    level: pick("level", Object.keys(levelLabels) as Level[]),
  };
}

/**
 * Planeree's textbooks, the same for every teacher. No learner context here: a teacher who came
 * from a learner only gets the way back (breadcrumbs and «Открыть для …» after adding).
 */
export function CatalogScreen() {
  const params = useSearchParams();
  const from = useReturnLearner();
  const router = useRouter();
  const variant = useVariant();
  // Version B has no catalog page: it is the «Каталог» half of the library's materials.
  useEffect(() => {
    if (variant === "b") router.replace(contextHref("/library", from?.id ?? null, { materials: "catalog" }));
  }, [variant, from, router]);
  const data = useStore((s) => s.data);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const { meta, setMetaFilter, resetMeta, levelOptions } = useMetaFilters(catalog, filtersFromParams(params));

  const metaFiltering = hasActiveFilters(meta);
  const textbooks = searchMaterials(catalog, query, meta).textbooks;
  const fromId = from?.id ?? null;
  if (variant === "b") return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        {from && <Breadcrumbs items={[{ label: from.name, href: contextHref("/library", from.id) }]} current="Каталог" />}
        <h1 className="sr-only">Каталог</h1>
        <SearchField value={query} onChange={setQuery} placeholder="Поиск по названию" />
        <MetaFilterBar meta={meta} levelOptions={levelOptions} onChange={setMetaFilter} active={metaFiltering} onReset={resetMeta} />
      </div>

      {textbooks.length === 0 ? (
        <EmptyState
          icon={<SearchX size={28} strokeWidth={1.5} aria-hidden />}
          title="Ничего не нашли"
          description="Попробуйте другое название или сбросьте фильтр."
          action={
            <Button
              onClick={() => {
                setQuery("");
                resetMeta();
              }}
            >
              Сбросить
            </Button>
          }
        />
      ) : (
        <div>
          <SectionLabel label={query.trim() || metaFiltering ? "Результаты поиска" : "Учебники"} />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {textbooks.map((t) => (
              <MaterialCard
                key={t.id}
                href={catalogHref(`/catalog/${t.id}`, fromId)}
                kind="textbook"
                title={t.title}
                caption={t.author?.name}
                lessonCount={textbookLessonCount(t)}
                cover={t.cover}
                coverImage={t.coverImage}
                badge={textbookFromCatalog(data, t.id) && <InLibraryChip />}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
