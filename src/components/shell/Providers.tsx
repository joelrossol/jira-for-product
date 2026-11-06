"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";
import { fetcher } from "@/lib/fetcher";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, keepPreviousData: true, revalidateOnFocus: true, dedupingInterval: 5_000 }}>
      {children}
    </SWRConfig>
  );
}
