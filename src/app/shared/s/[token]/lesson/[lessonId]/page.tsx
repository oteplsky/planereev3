import { SaveLinkLessonScreen } from "@/components/shared/SharedScreens";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  return (
    <Hydrated>
      <SaveLinkLessonScreen />
    </Hydrated>
  );
}
