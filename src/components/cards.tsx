"use client";

import Link from "next/link";
import { MessageSquare, Zap } from "lucide-react";
import { adfSnippet } from "@/lib/adf";
import { cn, timeAgo } from "@/lib/format";
import type { Epic, Issue, Thread } from "@/lib/types";
import { Avatar, Card, IssueTypeIcon, PriorityIcon, ProgressBar, StatusBadge } from "./ui";

export function IssueCard({
  issue,
  href,
  selected,
  showStatus = true,
  compact,
}: {
  issue: Issue;
  href: string;
  selected?: boolean;
  showStatus?: boolean;
  compact?: boolean;
}) {
  return (
    <Link href={href} scroll={false} className="block">
      <Card
        interactive={!selected}
        className={cn(
          "p-4",
          selected && "border-accent/40 bg-accent-soft/50 ring-2 ring-accent/20",
          compact && "p-3.5",
        )}
      >
        <div className="flex items-center gap-2 text-xs">
          <IssueTypeIcon type={issue.issueType} />
          <span className="font-semibold text-ink-2">{issue.key}</span>
          <span className="ml-auto text-ink-3">{timeAgo(issue.updated)}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-ink">{issue.summary}</p>
        {issue.parent?.isEpic && (
          <p className="mt-2 inline-flex max-w-full items-center gap-1 truncate rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700">
            <Zap className="size-3 shrink-0" />
            <span className="truncate">{issue.parent.summary}</span>
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          {showStatus && <StatusBadge status={issue.status} />}
          <PriorityIcon name={issue.priority?.name} />
          <Avatar user={issue.assignee} size={24} className="ml-auto" />
        </div>
      </Card>
    </Link>
  );
}

export function CommentCard({ thread, href, selected }: { thread: Thread; href: string; selected?: boolean }) {
  const { lastComment: c, issue } = thread;
  return (
    <Link href={href} scroll={false} className="block h-full">
      <Card
        interactive={!selected}
        className={cn(
          "flex h-full flex-col p-4",
          selected && "border-accent/40 bg-accent-soft/50 ring-2 ring-accent/20",
        )}
      >
        <div className="flex items-center gap-3">
          <Avatar user={c.author} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{c.author.displayName}</p>
            <p className="text-xs text-ink-3">{timeAgo(c.created)}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink-2">
            <MessageSquare className="size-3" />
            {thread.commentCount}
          </span>
        </div>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-2">
          {adfSnippet(c.body, 220) || "(no text)"}
        </p>
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-xs">
          <IssueTypeIcon type={issue.issueType} />
          <span className="shrink-0 font-semibold text-ink-2">{issue.key}</span>
          <span className="truncate text-ink-3">{issue.summary}</span>
        </div>
      </Card>
    </Link>
  );
}

export function EpicCard({ epic, href, selected }: { epic: Epic; href: string; selected?: boolean }) {
  const { progress } = epic;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <Link href={href} scroll={false} className="block h-full">
      <Card
        interactive={!selected}
        className={cn(
          "relative flex h-full flex-col overflow-hidden p-4",
          selected && "border-accent/40 bg-accent-soft/50 ring-2 ring-accent/20",
        )}
      >
        <div className="flex items-center gap-2 text-xs">
          <IssueTypeIcon type={epic.issueType} />
          <span className="font-semibold text-ink-2">{epic.key}</span>
          <StatusBadge status={epic.status} className="ml-auto" />
        </div>
        <p className="mt-3 line-clamp-2 flex-1 text-[15px] font-semibold leading-snug text-ink">{epic.summary}</p>
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="text-ink-3">
              {progress.done} of {progress.total} done
            </span>
            <span className="font-semibold text-ink-2">{pct}%</span>
          </div>
          <ProgressBar done={progress.done} inProgress={progress.inProgress} total={progress.total} />
        </div>
      </Card>
    </Link>
  );
}
