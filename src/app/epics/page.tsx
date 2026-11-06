import { Suspense } from "react";
import { EpicsPage } from "@/components/pages/EpicsPage";

// The page reads ?key= from the URL, so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <EpicsPage />
    </Suspense>
  );
}
