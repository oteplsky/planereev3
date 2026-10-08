import { Suspense } from "react";
import { TextbookScreen } from "@/components/textbook/TextbookScreen";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  return (
    <Suspense>
      <Hydrated>
        <TextbookScreen />
      </Hydrated>
    </Suspense>
  );
}
