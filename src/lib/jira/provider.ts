import "server-only";
import { textToAdf } from "../adf";
import type { AppConfig } from "../config";
import { JiraError } from "../errors";
import type { Provider } from "../provider";
import type { Comment, Issue, IssueActivity, Transition } from "../types";
import {
  SUMMARY_FIELDS,
  toComment,
  toIssue,
  toRelated,
  toStatus,
  toStatusChanges,
  toUser,
  type RawComment,
  type RawIssue,
  type RawStatus,
  type RawUser,
} from "./normalize";

// Short-lived cache so the half-dozen widgets on the dashboard share one set of
// Jira searches instead of each running their own. Writes clear it.
const CACHE_TTL_MS = 20_000;
const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
  value.catch(() => cache.delete(key));
  return value;
}

export function createJiraProvider(config: AppConfig): Provider {
  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");

  async function jira<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${config.baseUrl}${path}`, {
        method: init?.method ?? "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: init?.body === undefined ? undefined : JSON.stringify(init.body),
        cache: "no-store",
      });
    } catch {
      throw new JiraError(502, `Couldn't reach ${config.baseUrl}. Check JIRA_BASE_URL.`);
    }
    if (res.status === 401) {
      throw new JiraError(401, "Jira rejected the email or API token. Check JIRA_EMAIL and JIRA_API_TOKEN.");
    }
    if (!res.ok) {
      let message = `Jira returned ${res.status} ${res.statusText}`;
      try {
        const data = (await res.json()) as { errorMessages?: string[]; errors?: Record<string, string> };
        const details = [...(data.errorMessages ?? []), ...Object.values(data.errors ?? {})];
        if (details.length) message = details.join(" ");
      } catch {
        // Non-JSON error body; keep the status text.
      }
      throw new JiraError(res.status, message);
    }
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      // An HTML page here means the address isn't the site root (or isn't a Jira site).
      throw new JiraError(
        502,
        `${config.baseUrl} sent back a web page instead of Jira data. JIRA_BASE_URL should be just your site address, like https://your-site.atlassian.net.`,
      );
    }
  }

  // Enhanced JQL search (POST /rest/api/3/search/jql), following nextPageToken.
  async function search(jql: string, fields: string[], opts: { expand?: string; limit?: number } = {}) {
    const limit = opts.limit ?? config.maxIssues;
    const issues: RawIssue[] = [];
    let nextPageToken: string | undefined;
    do {
      const page = await jira<{ issues: RawIssue[]; nextPageToken?: string; isLast?: boolean }>(
        "/rest/api/3/search/jql",
        {
          method: "POST",
          body: {
            jql,
            fields,
            expand: opts.expand,
            maxResults: Math.min(100, limit - issues.length),
            nextPageToken,
          },
        },
      );
      issues.push(...page.issues);
      nextPageToken = page.isLast ? undefined : page.nextPageToken;
    } while (nextPageToken && issues.length < limit);
    return issues;
  }

  const projectClause = config.projects.length
    ? ` AND project in (${config.projects.map((p) => `"${p}"`).join(", ")})`
    : "";

  function clearCache() {
    cache.clear();
  }

  const issuePath = (key: string) => `/rest/api/3/issue/${encodeURIComponent(key)}`;

  async function children(epicKeys: string[]): Promise<Issue[]> {
    if (!epicKeys.length) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < epicKeys.length; i += 50) chunks.push(epicKeys.slice(i, i + 50));
    const results = await Promise.all(
      chunks.map((keys) =>
        cached(`children:${keys.join(",")}`, () =>
          search(`parent in (${keys.join(", ")}) ORDER BY updated DESC`, SUMMARY_FIELDS),
        ),
      ),
    );
    return results.flat().map(toIssue);
  }

  return {
    mode: "live",
    siteUrl: config.baseUrl,

    async me() {
      const raw = await cached("me", () => jira<RawUser>("/rest/api/3/myself"));
      return toUser(raw)!;
    },

    scopeIssues() {
      return cached("scope", async () => {
        const raw = await search(`(${config.scopeJql}) ORDER BY updated DESC`, SUMMARY_FIELDS);
        return raw.map(toIssue);
      });
    },

    activity(days) {
      return cached(`activity:${days}`, async () => {
        const raw = await search(
          `(${config.scopeJql}) AND updated >= -${days}d ORDER BY updated DESC`,
          [...SUMMARY_FIELDS, "comment"],
          { expand: "changelog", limit: Math.min(config.maxIssues, 300) },
        );
        return raw.map(
          (r): IssueActivity => ({
            ...toIssue(r),
            comments: (r.fields.comment?.comments ?? []).map((c) => toComment(c, r.key)),
            statusChanges: toStatusChanges(r),
          }),
        );
      });
    },

    async issue(key) {
      const raw = await jira<RawIssue>(
        `${issuePath(key)}?fields=${[...SUMMARY_FIELDS, "description", "subtasks", "issuelinks"].join(",")}`,
      );
      const issue = toIssue(raw);
      const kids = issue.issueType.isEpic ? await children([raw.key]) : [];
      return {
        ...issue,
        description: raw.fields.description ?? null,
        url: `${config.baseUrl}/browse/${raw.key}`,
        related: toRelated(raw, kids),
      };
    },

    async comments(key) {
      const out: Comment[] = [];
      let startAt = 0;
      for (;;) {
        const page = await jira<{ comments: RawComment[]; total: number }>(
          `${issuePath(key)}/comment?orderBy=created&startAt=${startAt}&maxResults=100`,
        );
        out.push(...page.comments.map((c) => toComment(c, key)));
        startAt += page.comments.length;
        if (!page.comments.length || startAt >= page.total || startAt >= 1000) break;
      }
      return out;
    },

    async addComment(key, text) {
      const raw = await jira<RawComment>(`${issuePath(key)}/comment`, {
        method: "POST",
        body: { body: textToAdf(text) },
      });
      clearCache();
      return toComment(raw, key);
    },

    async transitions(key) {
      const data = await jira<{ transitions: { id: string; name: string; to: RawStatus }[] }>(
        `${issuePath(key)}/transitions`,
      );
      return data.transitions.map((t): Transition => ({ id: t.id, name: t.name, to: toStatus(t.to) }));
    },

    async transition(key, transitionId) {
      await jira(`${issuePath(key)}/transitions`, {
        method: "POST",
        body: { transition: { id: transitionId } },
      });
      clearCache();
    },

    epics({ watchedOnly }) {
      return cached(`epics:${watchedOnly}`, async () => {
        const watched = watchedOnly ? "watcher = currentUser() AND " : "";
        const raw = await search(
          `${watched}issuetype = Epic${projectClause} ORDER BY updated DESC`,
          SUMMARY_FIELDS,
          { limit: 200 },
        );
        return raw.map(toIssue);
      });
    },

    children,
  };
}
