"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { postJson, refreshAll } from "@/lib/fetcher";
import { cn } from "@/lib/format";
import type { IssueDetail, Status, Transition } from "@/lib/types";
import { CATEGORY_STYLES } from "./ui";

// Status pill that opens a menu of the workflow transitions Jira allows from the current status.
export function StatusSelect({
  issueKey,
  status,
  onChanged,
}: {
  issueKey: string;
  status: Status;
  onChanged: (issue: IssueDetail) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { data: transitions, isLoading } = useSWR<Transition[]>(
    open ? `/api/tickets/${issueKey}/transitions` : null,
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function choose(t: Transition) {
    setSaving(t.to.name);
    setError(null);
    setOpen(false);
    try {
      const updated = await postJson<IssueDetail>(`/api/tickets/${issueKey}/transitions`, {
        transitionId: t.id,
      });
      onChanged(updated);
      void refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change status.");
    } finally {
      setSaving(null);
    }
  }

  const style = CATEGORY_STYLES[status.category];
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={Boolean(saving)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold ring-1 ring-inset transition hover:brightness-95 disabled:opacity-70",
          style.pill,
        )}
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <span className={cn("size-2 rounded-full", style.dot)} />}
        {saving ?? status.name}
        <ChevronDown className={cn("size-4 transition", open && "rotate-180")} />
      </button>
      {error && <p className="absolute left-0 top-full mt-1 w-72 text-xs text-rose-600">{error}</p>}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-40 w-64 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-pop"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">Move to</p>
          <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-ink-3">
            <span className={cn("size-2 rounded-full", style.dot)} />
            <span className="flex-1">{status.name}</span>
            <Check className="size-4" />
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 px-2.5 py-2 text-sm text-ink-3">
              <Loader2 className="size-3.5 animate-spin" /> Loading workflow…
            </div>
          )}
          {transitions
            ?.filter((t) => t.to.name !== status.name)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => choose(t)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-ink hover:bg-canvas"
              >
                <span className={cn("size-2 rounded-full", CATEGORY_STYLES[t.to.category].dot)} />
                <span className="flex-1">{t.to.name}</span>
                {t.name !== t.to.name && <span className="text-xs text-ink-3">{t.name}</span>}
              </button>
            ))}
          {transitions?.length === 0 && (
            <p className="px-2.5 py-2 text-sm text-ink-3">No transitions available.</p>
          )}
        </div>
      )}
    </div>
  );
}
