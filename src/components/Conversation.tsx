"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import useSWR from "swr";
import { Loader2, SendHorizontal } from "lucide-react";
import { textToAdf } from "@/lib/adf";
import { postJson, refreshAll } from "@/lib/fetcher";
import { cn, dayKey, formatDateTime } from "@/lib/format";
import type { Comment, SessionInfo } from "@/lib/types";
import { Adf } from "./Adf";
import { Avatar, EmptyState, ErrorState, Skeleton } from "./ui";

// The comment thread and composer shared by the Chat, Tickets and Epics pages.

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return "Today";
  if (dayKey(d) === dayKey(yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** A ticket's comments, oldest first, and `send`, which shows the new comment before Jira confirms it. */
export function useComments(issueKey: string) {
  const { data: session } = useSWR<SessionInfo>("/api/session");
  const {
    data: comments,
    error,
    mutate,
  } = useSWR<Comment[]>(`/api/tickets/${issueKey}/comments`, { keepPreviousData: false });
  const me = session?.user.accountId;

  async function send(text: string) {
    const now = new Date().toISOString();
    const pending: Comment = {
      id: `pending-${now}`,
      issueKey,
      author: { accountId: me ?? "me", displayName: "You" },
      body: textToAdf(text),
      created: now,
      updated: now,
    };
    await mutate(
      async (current = []) => [...current, await postJson<Comment>(`/api/tickets/${issueKey}/comments`, { text })],
      { optimisticData: (current = []) => [...current, pending], rollbackOnError: true, revalidate: false },
    );
    void refreshAll();
  }

  return { comments, error, me, send };
}

export function CommentThread({
  comments,
  error,
  me,
  scrollOnLoad = false,
  className,
}: {
  comments?: Comment[];
  error?: unknown;
  me?: string;
  /** Jump to the newest comment when the thread first loads (Chat). Otherwise only new comments scroll. */
  scrollOnLoad?: boolean;
  className?: string;
}) {
  const endRef = useRef<HTMLLIElement>(null);
  const seen = useRef<number | undefined>(undefined);

  useEffect(() => {
    const count = comments?.length;
    if (count === undefined) return;
    const first = seen.current === undefined;
    if (first ? scrollOnLoad : count > (seen.current ?? 0)) {
      endRef.current?.scrollIntoView({ block: "end", behavior: first ? "auto" : "smooth" });
    }
    seen.current = count;
  }, [comments?.length, scrollOnLoad]);

  if (error) return <ErrorState error={error} />;
  if (!comments) {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className={cn("h-20", i % 2 ? "ml-auto w-2/3" : "w-3/4")} />
        ))}
      </div>
    );
  }
  if (!comments.length) {
    return <EmptyState title="No comments yet" hint="Start the conversation below." className={className} />;
  }

  return (
    <ol className={cn("space-y-5", className)}>
      {comments.map((c, i) => {
        const mine = c.author.accountId === me;
        const label = dayLabel(c.created);
        const showDay = i === 0 || label !== dayLabel(comments[i - 1].created);
        return (
          <li key={c.id}>
            {showDay && (
              <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                <span className="h-px flex-1 bg-line" />
                {label}
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
            <div className={cn("flex gap-3", mine && "flex-row-reverse")}>
              <Avatar user={c.author} size={36} />
              <div className={cn("min-w-0 max-w-[80%]", mine && "text-right")}>
                <p className="mb-1 text-xs">
                  <span className="font-semibold text-ink">{mine ? "You" : c.author.displayName}</span>
                  <span className="ml-2 text-ink-3">{formatDateTime(c.created)}</span>
                </p>
                <div
                  className={cn(
                    "inline-block rounded-2xl px-4 py-3 text-left text-sm text-ink-2 shadow-card",
                    mine ? "rounded-tr-md bg-accent-soft ring-1 ring-indigo-100" : "rounded-tl-md bg-surface ring-1 ring-line",
                    c.id.startsWith("pending-") && "opacity-60",
                  )}
                >
                  <Adf doc={c.body} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
      {/* The bottom margin keeps a scrolled-to comment clear of a pinned composer. */}
      <li ref={endRef} aria-hidden className="scroll-mb-36" />
    </ol>
  );
}

export function Composer({
  onSend,
  pinned = false,
}: {
  onSend: (text: string) => Promise<void>;
  /** Stick to the bottom of the scrolling pane, over the page content. */
  pinned?: boolean;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(value);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post comment.");
    } finally {
      setSending(false);
      ref.current?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "border-t border-line px-6 py-4",
        pinned
          ? "sticky bottom-0 z-10 bg-surface/90 shadow-[0_-12px_32px_-20px_rgb(15_23_42/0.35)] backdrop-blur-md"
          : "bg-surface",
      )}
    >
      <div className={cn(pinned && "mx-auto max-w-5xl px-2")}>
        <div className="flex items-end gap-3 rounded-2xl border border-line bg-canvas p-2 pl-4 transition focus-within:border-accent/40 focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent/10">
          <textarea
            ref={ref}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Write a comment…"
            aria-label="New comment"
            className="max-h-[180px] flex-1 resize-none bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-3"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
            Send
          </button>
        </div>
        <p className={cn("mt-2 px-1 text-xs", error ? "text-rose-600" : "text-ink-3")}>
          {error ?? "Enter to send · Shift + Enter for a new line · posts to Jira as you"}
        </p>
      </div>
    </form>
  );
}
