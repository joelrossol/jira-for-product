// Normalized shapes shared by the API routes and the UI. Both the live Jira
// provider and the demo provider produce these, so the UI never sees raw Jira JSON.

export type StatusCategory = "new" | "indeterminate" | "done";

export interface User {
  accountId: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
}

export interface Status {
  id: string;
  name: string;
  category: StatusCategory;
}

export interface IssueType {
  name: string;
  iconUrl?: string;
  isEpic: boolean;
  isSubtask: boolean;
}

export interface IssueRef {
  key: string;
  summary: string;
  isEpic: boolean;
}

export interface Issue {
  id: string;
  key: string;
  summary: string;
  status: Status;
  issueType: IssueType;
  priority?: { name: string; iconUrl?: string };
  assignee?: User;
  reporter?: User;
  parent?: IssueRef;
  labels: string[];
  created: string;
  updated: string;
}

// Atlassian Document Format: Jira Cloud's rich-text JSON for descriptions and comments.
export interface AdfNode {
  type: string;
  version?: number;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: AdfNode[];
}

/** Another issue connected to the one being viewed. */
export interface RelatedIssue {
  key: string;
  summary: string;
  status: Status;
  issueType: IssueType;
  /** What the other issue is to this one: "Epic", "Child issue", "Subtask", "Blocks this", … */
  relation: string;
}

export interface IssueDetail extends Issue {
  description: AdfNode | null;
  url: string;
  /** Parent, children or subtasks, then issue links. */
  related: RelatedIssue[];
}

export interface Comment {
  id: string;
  issueKey: string;
  author: User;
  body: AdfNode | null;
  created: string;
  updated: string;
}

export interface StatusChange {
  at: string;
  from: string;
  to: string;
}

// An issue plus the history needed for activity stats.
export interface IssueActivity extends Issue {
  comments: Comment[];
  statusChanges: StatusChange[];
}

export interface Transition {
  id: string;
  name: string;
  to: Status;
}

export interface EpicProgress {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

export interface Epic extends Issue {
  progress: EpicProgress;
}

export interface EpicDetail extends IssueDetail {
  progress: EpicProgress;
}

export interface Thread {
  issue: Issue;
  lastComment: Comment;
  commentCount: number;
}

export interface DashboardData {
  stats: {
    stale: number;
    open: number;
    commentsThisWeek: number;
    staleDays: number;
  };
  /** ISO timestamps from the last 31 days; bucketed by day in the browser's time zone. */
  activity: { opened: string[]; completed: string[] };
  statusBreakdown: { status: string; category: StatusCategory; count: number }[];
  completedStatuses: string[];
}

export interface KanbanColumn {
  name: string;
  total: number;
  issues: Issue[];
}

export interface SessionInfo {
  mode: "live" | "demo";
  /** Jira credentials are set and demo isn't forced, so the Settings switch can go live. */
  liveAvailable: boolean;
  /** JIRA_DEMO is set on the server, which keeps everyone on demo data. */
  demoForced: boolean;
  user: User;
  siteUrl?: string;
  config: {
    scopeJql: string;
    staleDays: number;
    kanbanColumns: string[];
    completedStatuses: string[];
    acceptanceStatuses: string[];
  };
}
