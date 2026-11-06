import { Suspense } from "react";
import { TicketsPage } from "@/components/pages/TicketsPage";

// The page reads ?key= from the URL, so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <TicketsPage />
    </Suspense>
  );
}
