import { linkRelation } from "../relations";
import type {
  AdfNode,
  Comment,
  Issue,
  IssueType,
  RelatedIssue,
  Status,
  StatusCategory,
  StatusChange,
  User,
} from "../types";

// Minimal typings for the parts of Jira Cloud REST v3 responses we read.

export interface RawUser {
  accountId: string;
  displayName?: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
}

export interface RawStatus {
  id: string;
  name: string;
  statusCategory?: { key?: string };
}

interface RawIssueType {
  name?: string;
  iconUrl?: string;
  subtask?: boolean;
  hierarchyLevel?: number;
}

export interface RawComment {
  id: string;
  author?: RawUser;
  body?: AdfNode;
  created: string;
  updated: string;
}

// The trimmed-down issue Jira embeds for parents, subtasks and issue links.
interface RawLinkedIssue {
  key: string;
  fields?: { summary?: string; status?: RawStatus; issuetype?: RawIssueType };
}

export interface RawIssue {
  id: string;
  key: string;
  fields: {
    summary?: string;
    status?: RawStatus;
    issuetype?: RawIssueType;
    priority?: { name: string; iconUrl?: string };
    assignee?: RawUser | null;
    reporter?: RawUser | null;
    parent?: RawLinkedIssue;
    subtasks?: RawLinkedIssue[];
    issuelinks?: {
      type?: { inward?: string; outward?: string };
      inwardIssue?: RawLinkedIssue;
      outwardIssue?: RawLinkedIssue;
    }[];
    labels?: string[];
    created: string;
    updated: string;
    description?: AdfNode | null;
    comment?: { comments?: RawComment[] };
  };
  changelog?: {
    histories?: {
      created: string;
      items: { field: string; fromString?: string | null; toString?: string | null }[];
    }[];
  };
}

export const SUMMARY_FIELDS = [
  "summary",
  "status",
  "issuetype",
  "priority",
  "assignee",
  "reporter",
  "parent",
  "labels",
  "created",
  "updated",
];

function isEpicType(t?: RawIssueType): boolean {
  return t?.hierarchyLevel === 1 || t?.name?.toLowerCase() === "epic";
}

export function toUser(raw?: RawUser | null): User | undefined {
  if (!raw) return undefined;
  return {
    accountId: raw.accountId,
    displayName: raw.displayName ?? "Unknown user",
    avatarUrl: raw.avatarUrls?.["48x48"],
    email: raw.emailAddress,
  };
}

export function toStatus(raw?: RawStatus): Status {
  const key = raw?.statusCategory?.key;
  const category: StatusCategory = key === "done" || key === "indeterminate" ? key : "new";
  return { id: raw?.id ?? "", name: raw?.name ?? "Unknown", category };
}

function toIssueType(raw?: RawIssueType): IssueType {
  return {
    name: raw?.name ?? "Task",
    iconUrl: raw?.iconUrl,
    isEpic: isEpicType(raw),
    isSubtask: Boolean(raw?.subtask),
  };
}

export function toIssue(raw: RawIssue): Issue {
  const f = raw.fields;
  return {
    id: raw.id,
    key: raw.key,
    summary: f.summary ?? "",
    status: toStatus(f.status),
    issueType: toIssueType(f.issuetype),
    priority: f.priority ? { name: f.priority.name, iconUrl: f.priority.iconUrl } : undefined,
    assignee: toUser(f.assignee),
    reporter: toUser(f.reporter),
    parent: f.parent
      ? {
          key: f.parent.key,
          summary: f.parent.fields?.summary ?? "",
          isEpic: isEpicType(f.parent.fields?.issuetype),
        }
      : undefined,
    labels: f.labels ?? [],
    created: f.created,
    updated: f.updated,
  };
}

function toRelatedIssue(raw: RawLinkedIssue, relation: string): RelatedIssue {
  return {
    key: raw.key,
    summary: raw.fields?.summary ?? "",
    status: toStatus(raw.fields?.status),
    issueType: toIssueType(raw.fields?.issuetype),
    relation,
  };
}

/** `children` comes from a separate search, since an epic's tickets aren't embedded in it. */
export function toRelated(raw: RawIssue, children: Issue[]): RelatedIssue[] {
  const f = raw.fields;
  const related: RelatedIssue[] = [];
  if (f.parent) related.push(toRelatedIssue(f.parent, isEpicType(f.parent.fields?.issuetype) ? "Epic" : "Parent"));
  for (const c of children) {
    related.push({ key: c.key, summary: c.summary, status: c.status, issueType: c.issueType, relation: "Child issue" });
  }
  for (const s of f.subtasks ?? []) {
    if (!children.some((c) => c.key === s.key)) related.push(toRelatedIssue(s, "Subtask"));
  }
  // An entry holding outwardIssue means "this <outward> other", so the other issue
  // relates back with the inward phrase, and vice versa.
  for (const link of f.issuelinks ?? []) {
    if (link.outwardIssue) related.push(toRelatedIssue(link.outwardIssue, linkRelation(link.type?.inward ?? "")));
    if (link.inwardIssue) related.push(toRelatedIssue(link.inwardIssue, linkRelation(link.type?.outward ?? "")));
  }
  return related;
}

export function toComment(raw: RawComment, issueKey: string): Comment {
  return {
    id: raw.id,
    issueKey,
    author: toUser(raw.author) ?? { accountId: "unknown", displayName: "Unknown user" },
    body: raw.body ?? null,
    created: raw.created,
    updated: raw.updated,
  };
}

export function toStatusChanges(raw: RawIssue): StatusChange[] {
  return (raw.changelog?.histories ?? []).flatMap((h) =>
    h.items
      .filter((item) => item.field === "status")
      .map((item) => ({ at: h.created, from: item.fromString ?? "", to: item.toString ?? "" })),
  );
}
