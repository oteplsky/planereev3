import { Suspense } from "react";
import { ComingSoon } from "@/components/ComingSoon";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  return (
    <Suspense>
      <Hydrated>
        <ComingSoon kind="lesson" />
      </Hydrated>
    </Suspense>
  );
}
