import { SharedFolderScreen } from "@/components/shared/SharedScreens";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  return (
    <Hydrated>
      <SharedFolderScreen />
    </Hydrated>
  );
}
