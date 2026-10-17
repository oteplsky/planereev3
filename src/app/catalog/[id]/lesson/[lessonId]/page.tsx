import { Suspense } from "react";
import { CatalogLessonScreen } from "@/components/catalog/CatalogLessonScreen";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  // Reads ?from= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <Hydrated>
        <CatalogLessonScreen />
      </Hydrated>
    </Suspense>
  );
}
