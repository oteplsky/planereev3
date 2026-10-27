"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { contextHref, useReturnLearner } from "@/lib/context";

/** No catalog page of its own: the catalog is the «Готовые материалы» half of the library's materials. */
export function CatalogScreen() {
  const from = useReturnLearner();
  const router = useRouter();
  useEffect(() => {
    router.replace(contextHref("/library", from?.id ?? null, { materials: "catalog" }));
  }, [from, router]);
  return null;
}
