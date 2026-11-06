"use client";

import { useEffect, useState, type DragEvent } from "react";
import useSWR from "swr";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { postJson, refreshAll } from "@/lib/fetcher";
import { cn } from "@/lib/format";
import type { KanbanColumn } from "@/lib/types";
import { IssueCard } from "./cards";
import { ErrorState, Skeleton } from "./ui";

const COLUMN_DOTS = ["bg-slate-400", "bg-sky-500", "bg-indigo-500", "bg-violet-500", "bg-emerald-500"];

// Moves a card locally so the board updates before Jira answers. The moved card
// goes to the top, since the board is sorted by most recently updated.
function moveCard(columns: KanbanColumn[], key: string, to: string, limit?: number): KanbanColumn[] {
  const issue = columns.flatMap((c) => c.issues).find((i) => i.key === key);
  if (!issue) return columns;
  const moved = { ...issue, status: { ...issue.status, name: to }, updated: new Date().toISOString() };
  return columns.map((c) => {
    if (c.name === to) {
      const issues = [moved, ...c.issues];
      return { ...c, total: c.total + 1, issues: limit ? issues.slice(0, limit) : issues };
    }
    if (c.issues.some((i) => i.key === key)) {
      return { ...c, total: c.total - 1, issues: c.issues.filter((i) => i.key !== key) };
    }
    return c;
  });
}

function useKanban(limit?: number) {
  const { data, error, mutate } = useSWR<KanbanColumn[]>(limit ? `/api/kanban?limit=${limit}` : "/api/kanban");
  const [moving, setMoving] = useState<string[]>([]);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    if (!moveError) return;
    const timer = setTimeout(() => setMoveError(null), 8000);
    return () => clearTimeout(timer);
  }, [moveError]);

  async function move(key: string, to: string) {
    setMoveError(null);
    setMoving((m) => [...m, key]);
    try {
      // The server picks the workflow transition that leads into the column's status.
      await mutate(
        async () => {
          await postJson(`/api/tickets/${key}/transitions`, { toStatus: to });
          return undefined;
        },
        {
          optimisticData: (current) => (current ? moveCard(current, key, to, limit) : []),
          populateCache: false,
          rollbackOnError: true,
          revalidate: true,
        },
      );
      void refreshAll();
    } catch (err) {
      setMoveError(err instanceof Error ? err.message : `Couldn't move ${key}.`);
    } finally {
      setMoving((m) => m.filter((k) => k !== key));
    }
  }

  return { columns: data, error, move, moving, moveError, dismissError: () => setMoveError(null) };
}

/** Kanban columns backed by Jira statuses. Dragging a card to another column transitions it in Jira. */
export function KanbanBoard({ limit, className }: { limit?: number; className?: string }) {
  const { columns, error, move, moving, moveError, dismissError } = useKanban(limit);
  const [drag, setDrag] = useState<{ key: string; from: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);

  if (error) return <ErrorState error={error} />;

  const count = columns?.length ?? 3;
  const canDrop = (name: string) => drag !== null && drag.from !== name;

  function onDragStart(e: DragEvent<HTMLDivElement>, key: string, from: string) {
    const card = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.clearData();
    e.dataTransfer.setData("text/plain", key);
    e.dataTransfer.effectAllowed = "move";
    // Cards are links, which would otherwise drag as a URL; use the whole card as the drag image.
    e.dataTransfer.setDragImage(e.currentTarget, e.clientX - card.left, e.clientY - card.top);
    // Defer the state change so the drag image isn't captured mid-fade.
    requestAnimationFrame(() => setDrag({ key, from }));
  }

  function endDrag() {
    setDrag(null);
    setOver(null);
  }

  return (
    <>
      <div
        className={cn("grid gap-4", className)}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(260px, 1fr))` }}
      >
        {(columns ?? Array.from({ length: 3 }, () => null)).map((col, i) => {
          const target = col !== null && over === col.name;
          return (
            <section
              key={col?.name ?? i}
              aria-label={col?.name}
              onDragOver={(e) => {
                if (!col || !canDrop(col.name)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (over !== col.name) setOver(col.name);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setOver((o) => (o === col?.name ? null : o));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const dragged = drag;
                endDrag();
                if (col && dragged && dragged.from !== col.name) void move(dragged.key, col.name);
              }}
              className={cn(
                "flex min-w-0 flex-col rounded-2xl border border-line bg-slate-100/60 p-3 transition-colors",
                col && canDrop(col.name) && "border-dashed border-accent/30",
                target && "border-solid border-accent/50 bg-accent-soft/70 ring-4 ring-accent/10",
              )}
            >
              <header className="flex items-center gap-2 px-1.5 pb-3 pt-1">
                <span className={cn("size-2 rounded-full", COLUMN_DOTS[i % COLUMN_DOTS.length])} />
                {col ? (
                  <>
                    <h3 className="text-sm font-semibold text-ink">{col.name}</h3>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-2 ring-1 ring-inset ring-line">
                      {col.total}
                    </span>
                  </>
                ) : (
                  <Skeleton className="h-4 w-24" />
                )}
              </header>
              <div className="flex flex-1 flex-col gap-2.5">
                {!col && Array.from({ length: 3 }, (_, j) => <Skeleton key={j} className="h-[118px]" />)}
                {target && (
                  <div className="flex h-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-accent/40 bg-surface/70 text-xs font-semibold text-accent">
                    Move to {col.name}
                  </div>
                )}
                {col?.issues.map((issue) => {
                  const busy = moving.includes(issue.key);
                  return (
                    <div
                      key={issue.key}
                      draggable={!busy}
                      onDragStart={(e) => onDragStart(e, issue.key, col.name)}
                      onDragEnd={endDrag}
                      className={cn(
                        "relative cursor-grab rounded-2xl active:cursor-grabbing",
                        drag?.key === issue.key && "opacity-40",
                      )}
                    >
                      <IssueCard issue={issue} href={`/tickets?key=${issue.key}`} showStatus={false} compact />
                      {busy && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-surface/70 text-xs font-medium text-ink-2 backdrop-blur-[1px]">
                          <Loader2 className="size-4 animate-spin text-accent" /> Updating Jira…
                        </div>
                      )}
                    </div>
                  );
                })}
                {col && col.issues.length === 0 && !target && (
                  <p className="rounded-xl border border-dashed border-line-strong px-3 py-6 text-center text-xs text-ink-3">
                    Nothing in {col.name}
                  </p>
                )}
                {col && col.total > col.issues.length && (
                  <p className="px-1.5 pt-1 text-xs font-medium text-ink-3">+{col.total - col.issues.length} more</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {moveError && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 flex w-[min(560px,calc(100vw-32px))] -translate-x-1/2 items-start gap-3 rounded-2xl border border-rose-200 bg-surface px-4 py-3 text-sm shadow-pop"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">Couldn&apos;t move that ticket</p>
            <p className="mt-0.5 text-ink-2">{moveError}</p>
          </div>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Dismiss"
            className="rounded-lg p-1 text-ink-3 transition hover:bg-canvas hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
