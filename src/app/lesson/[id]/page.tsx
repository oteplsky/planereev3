import { Suspense } from "react";
import { LessonScreen } from "@/components/lesson/LessonScreen";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  return (
    <Suspense>
      <Hydrated>
        <LessonScreen />
      </Hydrated>
    </Suspense>
  );
}
