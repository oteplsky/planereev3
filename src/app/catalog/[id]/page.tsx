import { Suspense } from "react";
import { CatalogTextbookScreen } from "@/components/catalog/CatalogTextbookScreen";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  // Reads ?from= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <Hydrated>
        <CatalogTextbookScreen />
      </Hydrated>
    </Suspense>
  );
}
