import { SharedStandaloneLessonScreen } from "@/components/shared/SharedScreens";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  return (
    <Hydrated>
      <SharedStandaloneLessonScreen />
    </Hydrated>
  );
}
