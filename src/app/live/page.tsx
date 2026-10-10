import { Suspense } from "react";
import { LiveLessonScreen } from "@/components/live/LiveLessonScreen";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  // The learner and lesson come from ?learner= and ?lesson=, read on the client.
  return (
    <Suspense>
      <Hydrated>
        <LiveLessonScreen />
      </Hydrated>
    </Suspense>
  );
}
