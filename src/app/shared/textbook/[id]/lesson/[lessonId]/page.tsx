import { Suspense } from "react";
import { SharedLessonScreen } from "@/components/shared/SharedScreens";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  // Reads ?access= via useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <Hydrated>
        <SharedLessonScreen />
      </Hydrated>
    </Suspense>
  );
}
