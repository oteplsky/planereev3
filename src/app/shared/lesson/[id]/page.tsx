import { Suspense } from "react";
import { SharedStandaloneLessonScreen } from "@/components/shared/SharedScreens";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  // Reads ?access= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <Hydrated>
        <SharedStandaloneLessonScreen />
      </Hydrated>
    </Suspense>
  );
}
