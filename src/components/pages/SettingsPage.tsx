"use client";

import useSWR, { useSWRConfig } from "swr";
import { useState, type ReactNode } from "react";
import { CheckCircle2, ExternalLink, FlaskConical, Loader2 } from "lucide-react";
import { Avatar, Card, ErrorState, Skeleton } from "@/components/ui";
import { postJson, resetAll } from "@/lib/fetcher";
import { cn } from "@/lib/format";
import type { SessionInfo } from "@/lib/types";

const ENV_EXAMPLE = `JIRA_BASE_URL=https://your-site.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=your-api-token`;

function Row({ label, env, children }: { label: string; env: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-6">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <code className="text-[11px] text-ink-3">{env}</code>
      </div>
      <div className="min-w-0 text-sm text-ink-2">{children}</div>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={s} className="rounded-md bg-canvas px-2 py-0.5 text-xs font-medium text-ink-2 ring-1 ring-inset ring-line">
          {s}
        </span>
      ))}
    </div>
  );
}

function Switch({
  checked,
  disabled,
  busy,
  labelledBy,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  busy?: boolean;
  labelledBy: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 disabled:cursor-not-allowed",
        checked ? "bg-accent" : "bg-slate-300",
        disabled && "opacity-50",
      )}
    >
      <span
        className={cn(
          "inline-flex size-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      >
        {busy && <Loader2 className="size-3 animate-spin text-accent" />}
      </span>
    </button>
  );
}

// Per-browser switch between demo data and live Jira (a cookie, set by POST /api/session).
function DemoDataSwitch({ session }: { session: SessionInfo }) {
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const on = session.mode === "demo";
  const locked = !session.liveAvailable;

  async function change(demo: boolean) {
    setBusy(true);
    setError(null);
    try {
      const next = await postJson<SessionInfo>("/api/session", { demo });
      await mutate("/api/session", next, { revalidate: false });
      await resetAll("/api/session");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't switch data source.");
    } finally {
      setBusy(false);
    }
  }

  const hint = locked
    ? session.demoForced
      ? "Turned on for everyone by JIRA_DEMO on the server."
      : "Add your Jira credentials to switch to your own tickets."
    : on
      ? "Showing sample tickets. Turn this off to go back to your Jira."
      : "Explore with sample tickets. Anything you change in demo mode stays in memory and never reaches Jira.";

  return (
    <div className="mt-5 flex items-start justify-between gap-6 border-t border-line pt-5">
      <div className="min-w-0">
        <p id="demo-data-label" className="text-sm font-medium text-ink">
          Use demo data
        </p>
        <p className="mt-0.5 text-sm text-ink-3">{hint}</p>
        {!locked && <p className="mt-1 text-xs text-ink-3">Applies to this browser only.</p>}
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
      <Switch checked={on} disabled={locked} busy={busy} labelledBy="demo-data-label" onChange={change} />
    </div>
  );
}

export function SettingsPage() {
  const { data, error } = useSWR<SessionInfo>("/api/session");

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-3">
          Configuration is read from environment variables: <code>.env.local</code> locally, or Project Settings →
          Environment Variables on Vercel.
        </p>
      </div>

      {error && <ErrorState error={error} />}

      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Connection</h2>
        {!data ? (
          <Skeleton className="h-14" />
        ) : data.mode === "live" ? (
          <div className="flex items-center gap-4">
            <Avatar user={data.user} size={48} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{data.user.displayName}</p>
              <a
                href={data.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                {data.siteUrl} <ExternalLink className="size-3.5" />
              </a>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <CheckCircle2 className="size-3.5" /> Connected
            </span>
          </div>
        ) : data.liveAvailable ? (
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
            <FlaskConical className="mt-0.5 size-4 shrink-0" />
            <p>
              Your Jira connection is set up, but this browser is showing <strong>demo data</strong>. Changes you make
              are kept in memory and reset when the server restarts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
              <FlaskConical className="mt-0.5 size-4 shrink-0" />
              <p>
                You&apos;re viewing <strong>demo data</strong>. Changes you make are kept in memory and reset when the
                server restarts.
              </p>
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-2">
              <li>
                Create an API token at{" "}
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  id.atlassian.com → Security → API tokens
                </a>
                .
              </li>
              <li>
                Add these to <code>.env.local</code> in the project root (or to your Vercel project):
              </li>
            </ol>
            <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-[13px] leading-relaxed text-slate-100">
              {ENV_EXAMPLE}
            </pre>
            <p className="text-sm text-ink-2">Then restart the dev server (or redeploy).</p>
          </div>
        )}
        {data && <DemoDataSwitch session={data} />}
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-ink">Dashboard rules</h2>
        <p className="mt-0.5 text-sm text-ink-3">Optional overrides. Status names are matched case-insensitively.</p>
        {data ? (
          <div className="mt-2 divide-y divide-line">
            <Row label="Ticket scope" env="JIRA_SCOPE_JQL · JIRA_PROJECTS">
              <code className="break-words rounded-md bg-canvas px-2 py-1 text-xs text-ink">{data.config.scopeJql}</code>
            </Row>
            <Row label="Stale after" env="JIRA_STALE_DAYS">
              {data.config.staleDays} days without an update
            </Row>
            <Row label="Kanban columns" env="JIRA_KANBAN_COLUMNS">
              <Chips items={data.config.kanbanColumns} />
            </Row>
            <Row label="Counts as completed" env="JIRA_DONE_STATUSES">
              <Chips items={data.config.completedStatuses} />
            </Row>
            <Row label="Ready for acceptance" env="JIRA_ACCEPTANCE_STATUSES">
              <Chips items={data.config.acceptanceStatuses} />
            </Row>
          </div>
        ) : (
          <Skeleton className="mt-4 h-48" />
        )}
      </Card>
    </div>
  );
}
