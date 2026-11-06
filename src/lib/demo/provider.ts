import "server-only";
import { textToAdf } from "../adf";
import { JiraError } from "../errors";
import type { Provider } from "../provider";
import { linkRelation } from "../relations";
import type { Issue, IssueActivity, RelatedIssue } from "../types";
import { buildDemoData, ME, WORKFLOW, type DemoIssue } from "./data";

// Kept on globalThis so edits survive hot reloads during `next dev`.
const store = globalThis as unknown as { __demoIssues?: DemoIssue[] };

function issues(): DemoIssue[] {
  store.__demoIssues ??= buildDemoData();
  return store.__demoIssues;
}

function find(key: string): DemoIssue {
  const issue = issues().find((i) => i.key === key);
  if (!issue) throw new JiraError(404, `Issue ${key} does not exist.`);
  return issue;
}

function summary(i: DemoIssue): Issue {
  return {
    id: i.id,
    key: i.key,
    summary: i.summary,
    status: i.status,
    issueType: i.issueType,
    priority: i.priority,
    assignee: i.assignee,
    reporter: i.reporter,
    parent: i.parent,
    labels: i.labels,
    created: i.created,
    updated: i.updated,
  };
}

function byUpdated(list: DemoIssue[]) {
  return [...list].sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated));
}

function relatedTo(issue: DemoIssue): RelatedIssue[] {
  const all = issues();
  const ref = (i: DemoIssue, relation: string): RelatedIssue => ({
    key: i.key,
    summary: i.summary,
    status: i.status,
    issueType: i.issueType,
    relation,
  });
  const related: RelatedIssue[] = [];
  const parent = all.find((i) => i.key === issue.parent?.key);
  if (parent) related.push(ref(parent, parent.issueType.isEpic ? "Epic" : "Parent"));
  for (const child of byUpdated(all.filter((i) => i.parent?.key === issue.key))) related.push(ref(child, "Child issue"));
  for (const link of issue.links) {
    const other = all.find((i) => i.key === link.key);
    if (other) related.push(ref(other, linkRelation(link.inward)));
  }
  for (const other of all) {
    for (const link of other.links) if (link.key === issue.key) related.push(ref(other, linkRelation(link.outward)));
  }
  return related;
}

export function createDemoProvider(): Provider {
  return {
    mode: "demo",

    async me() {
      return ME;
    },

    async scopeIssues() {
      return byUpdated(issues()).map(summary);
    },

    async activity(days) {
      const since = Date.now() - days * 86_400_000;
      return byUpdated(issues())
        .filter((i) => Date.parse(i.updated) >= since)
        .map((i): IssueActivity => ({ ...summary(i), comments: i.comments, statusChanges: i.statusChanges }));
    },

    async issue(key) {
      const issue = find(key);
      const { comments: _c, statusChanges: _s, watchers: _w, links: _l, ...detail } = issue;
      return { ...detail, related: relatedTo(issue) };
    },

    async comments(key) {
      return [...find(key).comments].sort((a, b) => Date.parse(a.created) - Date.parse(b.created));
    },

    async addComment(key, text) {
      const issue = find(key);
      const now = new Date().toISOString();
      const comment = {
        id: `c-${key}-${Date.now()}`,
        issueKey: key,
        author: ME,
        body: textToAdf(text),
        created: now,
        updated: now,
      };
      issue.comments.push(comment);
      issue.updated = now;
      return comment;
    },

    async transitions(key) {
      const current = find(key).status.name;
      return WORKFLOW.filter((s) => s.name !== current).map((s) => ({
        id: `t-${s.name}`,
        name: s.name,
        to: { id: `s-${s.name}`, name: s.name, category: s.category },
      }));
    },

    async transition(key, transitionId) {
      const issue = find(key);
      const target = WORKFLOW.find((s) => `t-${s.name}` === transitionId);
      if (!target) throw new JiraError(400, "Transition is not valid for this issue.");
      const now = new Date().toISOString();
      issue.statusChanges.push({ at: now, from: issue.status.name, to: target.name });
      issue.status = { id: `s-${target.name}`, name: target.name, category: target.category };
      issue.updated = now;
    },

    async epics({ watchedOnly }) {
      return byUpdated(issues())
        .filter((i) => i.issueType.isEpic && (!watchedOnly || i.watchers.includes(ME.accountId)))
        .map(summary);
    },

    async children(epicKeys) {
      return byUpdated(issues())
        .filter((i) => i.parent && epicKeys.includes(i.parent.key))
        .map(summary);
    },
  };
}
