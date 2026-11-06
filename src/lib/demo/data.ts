import type { AdfNode, Comment, IssueDetail, StatusCategory, StatusChange, User } from "../types";

// A deterministic, realistic-looking dataset used when Jira credentials are not
// configured. Dates are generated relative to server start so the dashboard
// always has recent activity.

// `related` is derived from parents and links when an issue is read.
export interface DemoIssue extends Omit<IssueDetail, "related"> {
  comments: Comment[];
  statusChanges: StatusChange[];
  watchers: string[];
  /** Outward links from this issue, e.g. this issue "blocks" `key`. */
  links: { key: string; outward: string; inward: string }[];
}

const LINK_TYPES = [
  { outward: "blocks", inward: "is blocked by" },
  { outward: "relates to", inward: "relates to" },
  { outward: "relates to", inward: "relates to" },
  { outward: "duplicates", inward: "is duplicated by" },
];

export const WORKFLOW: { name: string; category: StatusCategory }[] = [
  { name: "Backlog", category: "new" },
  { name: "Ready", category: "new" },
  { name: "Ready for Dev", category: "new" },
  { name: "In Progress", category: "indeterminate" },
  { name: "In Review", category: "indeterminate" },
  { name: "Ready for Acceptance", category: "indeterminate" },
  { name: "Ready for Prod", category: "indeterminate" },
  { name: "Done", category: "done" },
];

export const ME: User = { accountId: "me", displayName: "Joel Rossol", email: "joel@example.com" };

const TEAM: User[] = [
  ME,
  { accountId: "u-priya", displayName: "Priya Natarajan" },
  { accountId: "u-marcus", displayName: "Marcus Chen" },
  { accountId: "u-sofia", displayName: "Sofia Alvarez" },
  { accountId: "u-dev", displayName: "Dev Okafor" },
  { accountId: "u-hannah", displayName: "Hannah Lindqvist" },
];

const EPICS = [
  { summary: "Checkout redesign", watched: true, status: "In Progress" },
  { summary: "Mobile app onboarding", watched: true, status: "In Progress" },
  { summary: "Search relevance v2", watched: true, status: "Ready for Dev" },
  { summary: "Billing migration to Stripe", watched: true, status: "In Progress" },
  { summary: "Design system 2.0", watched: false, status: "In Review" },
  { summary: "Product analytics pipeline", watched: false, status: "Backlog" },
];

// [summary, epic index or -1, status, issue type]
const TICKETS: [string, number, string, string][] = [
  ["Add Apple Pay to checkout flow", 0, "In Progress", "Story"],
  ["Persist cart across devices for signed-in users", 0, "Ready for Acceptance", "Story"],
  ["Fix tax rounding on multi-currency orders", 0, "Done", "Bug"],
  ["Inline address validation on shipping step", 0, "Ready for Dev", "Story"],
  ["Reduce checkout bundle size below 150kb", 0, "Ready", "Task"],
  ["Guest checkout: save email for order updates", 0, "Ready for Prod", "Story"],
  ["Progressive profile questions after signup", 1, "In Review", "Story"],
  ["Push notification permission priming screen", 1, "Ready for Acceptance", "Story"],
  ["Skip onboarding for invited team members", 1, "Backlog", "Story"],
  ["Animate welcome carousel", 1, "Done", "Task"],
  ["Onboarding crash on Android 12 when denying camera", 1, "In Progress", "Bug"],
  ["Typo tolerance for product names", 2, "Ready for Dev", "Story"],
  ["Boost recently viewed items in ranking", 2, "Ready", "Story"],
  ["Redesign search empty state", 2, "Ready for Dev", "Story"],
  ["Synonyms admin UI", 2, "Backlog", "Story"],
  ["Index variant attributes (size, color)", 2, "Ready", "Task"],
  ["Migrate subscription plans to Stripe Billing", 3, "In Progress", "Story"],
  ["Webhook handler for invoice.payment_failed", 3, "Ready for Acceptance", "Story"],
  ["Proration preview when changing plans", 3, "Ready for Dev", "Story"],
  ["Backfill Stripe customer IDs", 3, "Done", "Task"],
  ["Dunning email sequence", 3, "Backlog", "Story"],
  ["Export design tokens to CSS variables", 4, "Done", "Task"],
  ["Button component: loading and icon variants", 4, "Ready for Prod", "Story"],
  ["Audit color contrast across marketing site", 4, "Ready", "Task"],
  ["DataTable: sticky header and column resize", 4, "In Review", "Story"],
  ["Dark mode support in core components", 4, "Backlog", "Story"],
  ["Event schema for product analytics", 5, "Ready for Dev", "Task"],
  ["Stream events to the warehouse", 5, "Backlog", "Story"],
  ["Daily active users dashboard", 5, "Backlog", "Story"],
  ["Funnel report: signup to first purchase", 5, "Ready", "Story"],
  ["Login rate limiting returns 500 instead of 429", -1, "Ready for Acceptance", "Bug"],
  ["Upgrade Node runtime to 24 LTS", -1, "Done", "Task"],
  ["Flaky e2e test: password reset", -1, "In Progress", "Bug"],
  ["Image CDN cache headers are too short", -1, "Ready for Prod", "Bug"],
  ["Avatar upload crops incorrectly on profile page", -1, "Ready for Dev", "Bug"],
  ["SSO (SAML) for enterprise accounts", -1, "Backlog", "Story"],
  ["Order history pagination breaks after page 10", -1, "Done", "Bug"],
  ["Localize price formatting for de-DE", -1, "Ready", "Task"],
  ["Focus trap in modal dialogs", -1, "Ready for Acceptance", "Bug"],
  ["Remove legacy jQuery from settings page", -1, "Backlog", "Task"],
  ["Improve LCP on product detail page", -1, "In Review", "Task"],
  ["Email receipts: include shipping ETA", -1, "Done", "Story"],
  ["Feature flag cleanup", -1, "Ready", "Task"],
  ["Shareable wishlist link", -1, "Backlog", "Story"],
];

const COMMENTS: (string | ((me: string) => AdfNode))[] = [
  "Picked this up. First pass of the API changes is on a branch; PR coming tomorrow.",
  "Can we confirm the expected behavior when the user is offline? The spec doesn't cover it.",
  "QA passed on staging. Moving this along.",
  "Design is updated in Figma: spacing on mobile is now 16px and the CTA is full-width.",
  "Blocked on the vendor sandbox credentials. I've pinged their support.",
  "Looks good to me. One nit: the error copy should match the style guide.",
  "I can reproduce this on Safari 18 only. Chrome and Firefox are fine.",
  "Added acceptance criteria based on today's sync.",
  "Let's split this into backend and UI tickets so we can ship the API first.",
  "Perf numbers after the change: p95 went from 820ms to 310ms 🎉",
  "Product signed off. Ready to ship once release notes are drafted.",
  "Merged. I'll verify it in the next deploy.",
  "Heads up: this touches the billing webhook, so let's deploy outside business hours.",
  (me) => ({
    type: "paragraph",
    content: [
      { type: "mention", attrs: { id: "me", text: `@${me}` } },
      { type: "text", text: " can you take a look at the edge case for returning customers?" },
    ],
  }),
  (me) => ({
    type: "paragraph",
    content: [
      { type: "text", text: "Thanks " },
      { type: "mention", attrs: { id: "me", text: `@${me}` } },
      { type: "text", text: ", the screenshots helped. Fix is " },
      { type: "text", text: "behind a feature flag", marks: [{ type: "strong" }] },
      { type: "text", text: " for now." },
    ],
  }),
];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;

function paragraph(text: string): AdfNode {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

function description(summary: string, epic?: string): AdfNode {
  return {
    type: "doc",
    version: 1,
    content: [
      paragraph(
        `${summary}. This work ${epic ? `is part of the ${epic} initiative and ` : ""}should ship behind a feature flag so we can roll it out gradually and measure impact before going to 100%.`,
      ),
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Acceptance criteria" }] },
      {
        type: "bulletList",
        content: [
          "Works on the latest two versions of Chrome, Safari, Firefox and Edge",
          "Meets WCAG 2.2 AA for keyboard and screen reader users",
          "Analytics events fire for each new interaction",
          "Unit and e2e tests cover the happy path and one failure case",
        ].map((t) => ({ type: "listItem", content: [paragraph(t)] })),
      },
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Notes" }] },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "See the " },
          {
            type: "text",
            text: "design spec",
            marks: [{ type: "link", attrs: { href: "https://example.com/spec" } }],
          },
          { type: "text", text: " for edge cases. Config lives in " },
          { type: "text", text: "app/config/flags.ts", marks: [{ type: "code" }] },
          { type: "text", text: "." },
        ],
      },
    ],
  };
}

const heading = (text: string): AdfNode => ({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text }] });
const bullets = (items: string[]): AdfNode => ({
  type: "bulletList",
  content: items.map((t) => ({ type: "listItem", content: [paragraph(t)] })),
});

// Epics get a longer brief, the way real ones tend to.
function epicDescription(summary: string): AdfNode {
  return {
    type: "doc",
    version: 1,
    content: [
      paragraph(
        `${summary} is one of this quarter's bets. This brief covers why we're doing it, what's in and out of scope, how we'll ship it, and how we'll know it worked. Comment on the epic rather than in Slack so decisions stay with the work.`,
      ),
      heading("Why now"),
      paragraph(
        "Support tickets and session recordings point at the same friction, and two competitors shipped something comparable in the last six months. Leaving it another quarter means carrying the workaround code and the support load with it.",
      ),
      heading("Goals"),
      bullets([
        "Cut drop-off at this step by at least 15% for new customers",
        "Halve related support tickets within 60 days of full rollout",
        "Ship behind a flag with a clean rollback path at every stage",
        "Leave the codebase simpler than we found it: delete the legacy path",
      ]),
      heading("Scope"),
      bullets([
        "Web first, then iOS and Android once the web metrics hold for two weeks",
        "New analytics events for every step, with a dashboard before launch",
        "Accessibility review and fixes to WCAG 2.2 AA",
        "Migration of existing users with no action needed on their side",
      ]),
      heading("Out of scope"),
      bullets([
        "Pricing or plan changes, which are handled by the monetization team",
        "Admin and back-office tooling beyond what support needs on day one",
        "Localization past the five launch languages",
      ]),
      heading("Milestones"),
      bullets([
        "Design review and technical spec signed off",
        "Internal dogfood behind the flag",
        "5% rollout with alerting on error rate and conversion",
        "50% rollout and a holdback group for measurement",
        "100% rollout and removal of the legacy code path",
      ]),
      heading("Risks"),
      paragraph(
        "The biggest risk is the data migration: it touches every active account, so it runs in batches with a dry run first and a reconciliation report after each batch. Second is third-party rate limits during the 50% stage; we've asked for a temporary increase.",
      ),
      heading("Open questions"),
      bullets([
        "Do we need legal review for the new consent copy?",
        "Who owns the dashboard after launch: product analytics or this team?",
        "Is a two-week holdback long enough to see the retention effect?",
      ]),
      paragraph(
        "Owner: Joel. Design: Sofia. Engineering lead: Marcus. Weekly check-in on Thursdays; notes are linked from the epic.",
      ),
    ],
  };
}

function history(target: string, created: number, updated: number): StatusChange[] {
  const end = WORKFLOW.findIndex((s) => s.name === target);
  if (end <= 0) return [];
  const span = Math.max(updated - created, DAY);
  return WORKFLOW.slice(1, end + 1).map((s, i) => ({
    at: new Date(i === end - 1 ? updated : created + (span * (i + 1)) / (end + 1)).toISOString(),
    from: WORKFLOW[i].name,
    to: s.name,
  }));
}

export function buildDemoData(): DemoIssue[] {
  const rand = rng(42);
  const now = Date.now();
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const status = (name: string) => {
    const s = WORKFLOW.find((w) => w.name === name)!;
    return { id: `s-${name}`, name: s.name, category: s.category };
  };
  const others = TEAM.filter((u) => u !== ME);
  let seq = 100;
  const issues: DemoIssue[] = [];

  const make = (summary: string, type: string, statusName: string, epic?: DemoIssue): DemoIssue => {
    const key = `WEB-${seq++}`;
    const isEpic = type === "Epic";
    const isBacklog = statusName === "Backlog" || statusName === "Ready";
    const createdAgo = 5 + rand() * 55;
    // Some untouched backlog items go stale; everything else moved recently.
    const updatedAgo =
      isBacklog && createdAgo > 16 && rand() < 0.6
        ? 15 + rand() * (createdAgo - 16)
        : rand() * Math.min(createdAgo - 1, 26);
    const created = now - createdAgo * DAY;
    const updated = now - Math.max(updatedAgo, 0.02) * DAY;
    const reporter = rand() < 0.55 ? ME : pick(others);
    const assignee = statusName === "Backlog" && rand() < 0.4 ? undefined : reporter === ME ? pick(others) : ME;

    const commentCount = isBacklog ? Math.floor(rand() * 2) : 1 + Math.floor(rand() * 4);
    // Walk backwards from the last update so comments are in chronological order.
    const comments: Comment[] = [];
    let at = updated;
    for (let i = commentCount - 1; i >= 0; i--) {
      const text = pick(COMMENTS);
      const author = i === commentCount - 1 && rand() < 0.75 ? pick(others) : pick(TEAM);
      const when = new Date(Math.max(at, created + DAY / 2)).toISOString();
      comments.unshift({
        id: `c-${key}-${i}`,
        issueKey: key,
        author,
        body: {
          type: "doc",
          version: 1,
          content: [typeof text === "string" ? paragraph(text) : text(ME.displayName)],
        },
        created: when,
        updated: when,
      });
      at -= (0.1 + rand() * 2.5) * DAY;
    }

    return {
      id: key,
      key,
      summary,
      status: status(statusName),
      issueType: { name: type, isEpic, isSubtask: false },
      priority: { name: pick(["Highest", "High", "Medium", "Medium", "Low"]) },
      assignee: isEpic ? ME : assignee,
      reporter,
      parent: epic ? { key: epic.key, summary: epic.summary, isEpic: true } : undefined,
      labels: rand() < 0.4 ? [pick(["frontend", "backend", "mobile", "a11y", "perf", "payments"])] : [],
      created: new Date(created).toISOString(),
      updated: new Date(updated).toISOString(),
      description: isEpic ? epicDescription(summary) : description(summary, epic?.summary),
      url: `https://your-site.atlassian.net/browse/${key}`,
      comments: isEpic ? [] : comments,
      statusChanges: history(statusName, created, updated),
      watchers: [],
      links: [],
    };
  };

  const epics = EPICS.map((e) => {
    const epic = make(e.summary, "Epic", e.status);
    epic.watchers = e.watched ? [ME.accountId] : [];
    epic.updated = new Date(now - rand() * 6 * DAY).toISOString();
    return epic;
  });
  issues.push(...epics);
  for (const [summary, epicIndex, statusName, type] of TICKETS) {
    issues.push(make(summary, type, statusName, epics[epicIndex]));
  }
  // A few issue links so the related-tickets tables have something to show.
  const tickets = issues.filter((i) => !i.issueType.isEpic);
  for (const issue of tickets) {
    if (rand() > 0.4) continue;
    const other = pick(tickets);
    if (other !== issue) issue.links.push({ key: other.key, ...pick(LINK_TYPES) });
  }
  return issues.sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated));
}
