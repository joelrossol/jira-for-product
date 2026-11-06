import { Suspense } from "react";
import { ChatPage } from "@/components/pages/ChatPage";

// The page reads ?key= from the URL, so it renders inside a Suspense boundary.
export default function Page() {
  return (
    <Suspense>
      <ChatPage />
    </Suspense>
  );
}
