import "server-only";
import { getConfig } from "./config";
import { createDemoProvider } from "./demo/provider";
import { createJiraProvider } from "./jira/provider";
import type { Comment, Issue, IssueActivity, IssueDetail, Transition, User } from "./types";

// The data source behind every API route. The live provider talks to Jira Cloud;
// the demo provider serves an in-memory dataset when no credentials are configured.
export interface Provider {
  mode: "live" | "demo";
  siteUrl?: string;
  me(): Promise<User>;
  /** Every issue in the configured scope (epics included), most recently updated first. */
  scopeIssues(): Promise<Issue[]>;
  /** Scope issues updated in the last `days` days, with comments and status history. */
  activity(days: number): Promise<IssueActivity[]>;
  issue(key: string): Promise<IssueDetail>;
  /** Oldest first. */
  comments(key: string): Promise<Comment[]>;
  addComment(key: string, text: string): Promise<Comment>;
  transitions(key: string): Promise<Transition[]>;
  transition(key: string, transitionId: string): Promise<void>;
  epics(opts: { watchedOnly: boolean }): Promise<Issue[]>;
  children(epicKeys: string[]): Promise<Issue[]>;
}

/** `demo` is this browser's choice from Settings; without live credentials it's always demo. */
export function getProvider({ demo = false }: { demo?: boolean } = {}): Provider {
  const config = getConfig();
  return config.live && !demo ? createJiraProvider(config) : createDemoProvider();
}
