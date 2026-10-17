import { Suspense } from "react";
import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  // Reads ?from= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <Hydrated>
        <CatalogScreen />
      </Hydrated>
    </Suspense>
  );
}
