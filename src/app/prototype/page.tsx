import { Hydrated } from "@/components/StoreGate";
import { PrototypeLauncher } from "@/components/PrototypeLauncher";

export default function PrototypePage() {
  return (
    <Hydrated>
      <PrototypeLauncher />
    </Hydrated>
  );
}
