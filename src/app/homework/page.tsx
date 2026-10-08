import { Suspense } from "react";
import { HomeworkScreen } from "@/components/learner/LearnerListScreens";
import { Hydrated } from "@/components/StoreGate";

export default function Page() {
  // The learner comes from ?learner=, read on the client.
  return (
    <Suspense>
      <Hydrated>
        <HomeworkScreen />
      </Hydrated>
    </Suspense>
  );
}
