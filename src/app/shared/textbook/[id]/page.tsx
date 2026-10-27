import { Suspense } from "react";
import { SharedTextbookScreen } from "@/components/shared/SharedScreens";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  // Reads ?access= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <Hydrated>
        <SharedTextbookScreen />
      </Hydrated>
    </Suspense>
  );
}
