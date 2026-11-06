import "server-only";

// All configuration comes from environment variables so the same build runs
// locally (.env.local) and on Vercel (Project Settings → Environment Variables).

function list(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function int(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Accepts "joel.atlassian.net" or a pasted page URL and keeps just the origin.
function siteOrigin(value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  try {
    return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).origin;
  } catch {
    return undefined;
  }
}

export function getConfig() {
  const baseUrl = siteOrigin(process.env.JIRA_BASE_URL);
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projects = list(process.env.JIRA_PROJECTS, []);

  const baseScope =
    process.env.JIRA_SCOPE_JQL?.trim() || "assignee = currentUser() OR reporter = currentUser()";
  const scopeJql = projects.length
    ? `(${baseScope}) AND project in (${projects.map((p) => `"${p}"`).join(", ")})`
    : baseScope;

  // JIRA_DEMO=1 forces demo data for every visitor. Otherwise each browser can
  // switch to it from Settings (see DEMO_COOKIE in api.ts).
  const demoForced = /^(1|true|yes)$/i.test(process.env.JIRA_DEMO ?? "");

  return {
    /** Live Jira is available: credentials are set and demo isn't forced. */
    live: Boolean(baseUrl && email && apiToken) && !demoForced,
    demoForced,
    baseUrl,
    email,
    apiToken,
    projects,
    scopeJql,
    staleDays: int(process.env.JIRA_STALE_DAYS, 14),
    maxIssues: int(process.env.JIRA_MAX_ISSUES, 1000),
    kanbanColumns: list(process.env.JIRA_KANBAN_COLUMNS, ["Backlog", "Ready", "Ready for Dev"]),
    completedStatuses: list(process.env.JIRA_DONE_STATUSES, ["Done", "Ready for Prod"]),
    acceptanceStatuses: list(process.env.JIRA_ACCEPTANCE_STATUSES, ["Ready for Acceptance"]),
  };
}

export type AppConfig = ReturnType<typeof getConfig>;
