"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ArrowUpRight, MessagesSquare } from "lucide-react";
import { CommentCard } from "@/components/cards";
import { CommentThread, Composer, useComments } from "@/components/Conversation";
import { MasterDetail } from "@/components/MasterDetail";
import { EmptyState, ErrorState, IssueTypeIcon, Skeleton, StatusBadge } from "@/components/ui";
import type { IssueDetail, Thread } from "@/lib/types";

function ThreadView({ issueKey }: { issueKey: string }) {
  const { data: issue } = useSWR<IssueDetail>(`/api/tickets/${issueKey}`, { keepPreviousData: false });
  const { comments, error, me, send } = useComments(issueKey);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-6 py-4">
        {issue ? (
          <>
            <IssueTypeIcon type={issue.issueType} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-3">{issue.key}</p>
              <p className="truncate text-[15px] font-semibold text-ink">{issue.summary}</p>
            </div>
            <StatusBadge status={issue.status} />
            <Link
              href={`/tickets?key=${issue.key}`}
              className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition hover:border-line-strong hover:text-ink"
            >
              View ticket <ArrowUpRight className="size-3.5" />
            </Link>
          </>
        ) : (
          <Skeleton className="h-10 w-80" />
        )}
      </header>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto bg-canvas/60 px-6 py-6">
        <CommentThread comments={comments} error={error} me={me} scrollOnLoad className="mx-auto max-w-3xl" />
      </div>

      <Composer onSend={send} />
    </div>
  );
}

export function ChatPage() {
  const params = useSearchParams();
  const { data: threads, error } = useSWR<Thread[]>("/api/threads?limit=50");
  const selected = params.get("key") ?? threads?.[0]?.issue.key;

  return (
    <MasterDetail
      title="Chat"
      subtitle="Latest comment on each of your tickets"
      list={
        error ? (
          <ErrorState error={error} />
        ) : !threads ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-[170px]" />
            ))}
          </div>
        ) : threads.length ? (
          <div className="space-y-2.5">
            {threads.map((t) => (
              <CommentCard
                key={t.issue.key}
                thread={t}
                href={`/chat?key=${t.issue.key}`}
                selected={t.issue.key === selected}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No recent comments" />
        )
      }
      detail={
        selected ? (
          <ThreadView key={selected} issueKey={selected} />
        ) : threads ? (
          <EmptyState
            title="Pick a conversation"
            icon={<MessagesSquare className="size-5" />}
            className="m-8 border-none bg-transparent"
          />
        ) : null
      }
    />
  );
}
