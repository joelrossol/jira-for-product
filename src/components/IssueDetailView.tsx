"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarPlus, ExternalLink, MessagesSquare, Tag, Zap } from "lucide-react";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";
import type { IssueDetail } from "@/lib/types";
import { Adf } from "./Adf";
import { CommentThread, Composer, useComments } from "./Conversation";
import { Expandable } from "./Expandable";
import { RelatedIssues } from "./RelatedIssues";
import { StatusSelect } from "./StatusSelect";
import { Avatar, Card, IssueTypeIcon, PriorityIcon, Skeleton } from "./ui";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">{label}</p>
      <div className="flex min-h-7 items-center text-sm text-ink">{children}</div>
    </div>
  );
}

function Person({ user, empty }: { user?: IssueDetail["assignee"]; empty: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar user={user} size={28} />
      <span className={user ? "truncate font-medium" : "text-ink-3"}>{user?.displayName ?? empty}</span>
    </span>
  );
}

// People, epic, labels and created date in one strip above the content. "Updated" sits by the status.
function Properties({ issue }: { issue: IssueDetail }) {
  return (
    <Card className="grid gap-x-6 gap-y-5 px-6 py-5 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
      <Field label="Assignee">
        <Person user={issue.assignee} empty="Unassigned" />
      </Field>
      <Field label="Reporter">
        <Person user={issue.reporter} empty="Unknown" />
      </Field>
      {!issue.issueType.isEpic && (
        <Field label="Epic">
          {issue.parent?.isEpic ? (
            <Link
              href={`/epics?key=${issue.parent.key}`}
              className="flex min-w-0 items-center gap-1.5 font-medium text-violet-700 hover:underline"
            >
              <Zap className="size-4 shrink-0" />
              <span className="truncate">{issue.parent.summary}</span>
            </Link>
          ) : (
            <span className="text-ink-3">None</span>
          )}
        </Field>
      )}
      <Field label="Labels">
        {issue.labels.length ? (
          <span className="flex flex-wrap gap-1.5">
            {issue.labels.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-0.5 text-xs font-medium text-ink-2"
              >
                <Tag className="size-3" />
                {l}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-ink-3">None</span>
        )}
      </Field>
      <Field label="Created">
        <span className="flex items-center gap-2 text-ink-2" title={formatDateTime(issue.created)}>
          <CalendarPlus className="size-4 text-ink-3" /> {formatDate(issue.created)}
        </span>
      </Field>
    </Card>
  );
}

export function IssueDetailView({
  issue,
  onChanged,
  relatedTitle = "Related tickets",
  relatedEmpty = "No parent, subtasks or linked tickets.",
  children,
}: {
  issue: IssueDetail;
  onChanged: (issue: IssueDetail) => void;
  relatedTitle?: string;
  relatedEmpty?: string;
  /** Extra sections (e.g. epic progress), shown above the description. */
  children?: ReactNode;
}) {
  const conversation = useComments(issue.key);

  return (
    <div className="flex min-h-full flex-col">
      <article className="mx-auto w-full max-w-5xl flex-1 px-8 pb-10 pt-8">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <IssueTypeIcon type={issue.issueType} />
          <span className="font-semibold text-ink-2">{issue.key}</span>
          <span className="text-ink-3">· {issue.issueType.name}</span>
          {issue.parent && (
            <>
              <span className="text-ink-3">/</span>
              <Link
                href={issue.parent.isEpic ? `/epics?key=${issue.parent.key}` : `/tickets?key=${issue.parent.key}`}
                className="inline-flex min-w-0 items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
              >
                {issue.parent.isEpic && <Zap className="size-3" />}
                <span className="truncate">{issue.parent.summary}</span>
              </Link>
            </>
          )}
          <a
            href={issue.url}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 shadow-card transition hover:border-line-strong hover:text-ink"
          >
            Open in Jira <ExternalLink className="size-3.5" />
          </a>
        </div>

        <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-ink">{issue.summary}</h1>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StatusSelect issueKey={issue.key} status={issue.status} onChanged={onChanged} />
          {issue.priority && (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm text-ink-2">
              <PriorityIcon name={issue.priority.name} />
              {issue.priority.name}
            </span>
          )}
          <span className="text-sm text-ink-3" title={formatDateTime(issue.updated)}>
            Updated {timeAgo(issue.updated)}
          </span>
        </div>

        <div className="mt-6 space-y-6">
          <Properties issue={issue} />
          {children}
          <Card className="p-6">
            <h3 className="mb-3 text-sm font-semibold text-ink">Description</h3>
            {issue.description?.content?.length ? (
              <Expandable lines={25} className="text-[15px] leading-relaxed text-ink-2">
                <Adf doc={issue.description} />
              </Expandable>
            ) : (
              <p className="text-sm text-ink-3">No description.</p>
            )}
          </Card>
          <RelatedIssues title={relatedTitle} items={issue.related} empty={relatedEmpty} />
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
              <MessagesSquare className="size-4 text-ink-3" />
              Conversation
              {conversation.comments && <span className="font-normal text-ink-3">· {conversation.comments.length}</span>}
            </h3>
            <CommentThread comments={conversation.comments} error={conversation.error} me={conversation.me} />
          </section>
        </div>
      </article>
      <Composer onSend={conversation.send} pinned />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-8 py-8">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-2 h-[86px]" />
      <Skeleton className="h-72" />
      <Skeleton className="h-40" />
    </div>
  );
}
