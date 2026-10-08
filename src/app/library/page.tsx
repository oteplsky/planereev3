import { Suspense } from "react";
import { LibraryScreen } from "@/components/LibraryScreen";
import { Hydrated } from "@/components/StoreGate";

export default function LibraryPage() {
  // LibraryScreen reads ?learner= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <Hydrated>
        <LibraryScreen />
      </Hydrated>
    </Suspense>
  );
}
