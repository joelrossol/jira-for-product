"use client";

import useSWR from "swr";
import { KanbanBoard } from "@/components/KanbanBoard";
import type { KanbanColumn } from "@/lib/types";

export function KanbanPage() {
  const { data } = useSWR<KanbanColumn[]>("/api/kanban");
  const total = data?.reduce((sum, c) => sum + c.total, 0);
  return (
    <div className="flex h-full min-h-0 flex-col px-8 py-8">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">Kanban</h1>
        <p className="mt-1 text-sm text-ink-3">
          {total === undefined
            ? "Loading tickets…"
            : `${total} tickets · most recently updated first · drag a card to change its status in Jira`}
        </p>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-auto pb-2">
        <KanbanBoard className="min-h-full items-start" />
      </div>
    </div>
  );
}
