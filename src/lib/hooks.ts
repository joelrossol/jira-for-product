"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** False during prerender and hydration, true afterwards. Gate clock-dependent UI on it. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
