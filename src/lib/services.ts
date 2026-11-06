import "server-only";
import { getConfig } from "./config";
import type { Provider } from "./provider";
import type {
  DashboardData,
  Epic,
  EpicDetail,
  EpicProgress,
  Issue,
  KanbanColumn,
  SessionInfo,
  StatusCategory,
  Thread,
} from "./types";

const DAY = 86_400_000;
const CATEGORY_ORDER: Record<StatusCategory, number> = { new: 0, indeterminate: 1, done: 2 };

const lower = (xs: string[]) => new Set(xs.map((x) => x.toLowerCase()));
const tickets = <T extends Issue>(issues: T[]) => issues.filter((i) => !i.issueType.isEpic);

export async function getSession(p: Provider): Promise<SessionInfo> {
  const config = getConfig();
  return {
    mode: p.mode,
    liveAvailable: config.live,
    demoForced: config.demoForced,
    user: await p.me(),
    siteUrl: p.siteUrl,
    config: {
      scopeJql: config.scopeJql,
      staleDays: config.staleDays,
      kanbanColumns: config.kanbanColumns,
      completedStatuses: config.completedStatuses,
      acceptanceStatuses: config.acceptanceStatuses,
    },
  };
}

export async function getDashboard(p: Provider): Promise<DashboardData> {
  const config = getConfig();
  const now = Date.now();
  const [scope, activity] = await Promise.all([p.scopeIssues(), p.activity(31)]);
  const all = tickets(scope);
  const open = all.filter((i) => i.status.category !== "done");
  const completedNames = lower(config.completedStatuses);
  const windowStart = now - 31 * DAY;

  // A ticket counts as completed on the first day in the window it entered a
  // "done-like" status, so Ready for Prod → Done isn't counted twice.
  const completed = tickets(activity).flatMap((issue) => {
    const first = issue.statusChanges
      .filter((c) => completedNames.has(c.to.toLowerCase()) && Date.parse(c.at) >= windowStart)
      .map((c) => c.at)
      .sort()[0];
    return first ? [first] : [];
  });

  const byStatus = new Map<string, { status: string; category: StatusCategory; count: number }>();
  for (const issue of all) {
    const entry = byStatus.get(issue.status.name) ?? {
      status: issue.status.name,
      category: issue.status.category,
      count: 0,
    };
    entry.count++;
    byStatus.set(issue.status.name, entry);
  }

  return {
    stats: {
      open: open.length,
      stale: open.filter((i) => now - Date.parse(i.updated) > config.staleDays * DAY).length,
      commentsThisWeek: activity
        .flatMap((i) => i.comments)
        .filter((c) => now - Date.parse(c.created) <= 7 * DAY).length,
      staleDays: config.staleDays,
    },
    activity: {
      opened: all.map((i) => i.created).filter((c) => Date.parse(c) >= windowStart),
      completed,
    },
    // Stable order (category, then name) so each status keeps its chart color as counts change.
    statusBreakdown: [...byStatus.values()].sort(
      (a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] || a.status.localeCompare(b.status),
    ),
    completedStatuses: config.completedStatuses,
  };
}

export async function getKanban(p: Provider, limit?: number): Promise<KanbanColumn[]> {
  const config = getConfig();
  const all = tickets(await p.scopeIssues());
  return config.kanbanColumns.map((name) => {
    const issues = all.filter((i) => i.status.name.toLowerCase() === name.toLowerCase());
    return { name, total: issues.length, issues: limit ? issues.slice(0, limit) : issues };
  });
}

export async function listTickets(
  p: Provider,
  view: "recent" | "acceptance" | "open",
  limit: number,
): Promise<Issue[]> {
  const config = getConfig();
  const acceptance = lower(config.acceptanceStatuses);
  const all = tickets(await p.scopeIssues());
  const filtered =
    view === "acceptance"
      ? all.filter((i) => acceptance.has(i.status.name.toLowerCase()))
      : view === "open"
        ? all.filter((i) => i.status.category !== "done")
        : all;
  return filtered.slice(0, limit);
}

export async function getThreads(p: Provider, limit: number): Promise<Thread[]> {
  const activity = await p.activity(60);
  return activity
    .filter((i) => i.comments.length)
    .map(({ comments, statusChanges: _statusChanges, ...issue }): Thread => {
      const lastComment = comments.reduce((a, b) => (Date.parse(b.created) > Date.parse(a.created) ? b : a));
      return { issue, lastComment, commentCount: comments.length };
    })
    .sort((a, b) => Date.parse(b.lastComment.created) - Date.parse(a.lastComment.created))
    .slice(0, limit);
}

function progressOf(children: Issue[]): EpicProgress {
  const count = (c: StatusCategory) => children.filter((i) => i.status.category === c).length;
  return { total: children.length, todo: count("new"), inProgress: count("indeterminate"), done: count("done") };
}

export async function listEpics(p: Provider, watchedOnly: boolean): Promise<Epic[]> {
  const epics = await p.epics({ watchedOnly });
  const children = await p.children(epics.map((e) => e.key));
  return epics.map((epic) => ({
    ...epic,
    progress: progressOf(children.filter((c) => c.parent?.key === epic.key)),
  }));
}

export async function getEpic(p: Provider, key: string): Promise<EpicDetail> {
  const [detail, children] = await Promise.all([p.issue(key), p.children([key])]);
  return { ...detail, progress: progressOf(children) };
}
