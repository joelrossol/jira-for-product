"use client";

import Link from "next/link";
import useSWR from "swr";
import type { ReactNode } from "react";
import { ArrowRight, CircleDot, Hourglass, MessageSquareText, Plug } from "lucide-react";
import { CommentCard, EpicCard, IssueCard } from "@/components/cards";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Card, EmptyState, ErrorState, SectionHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import type { DashboardData, Epic, Issue, SessionInfo, Thread } from "@/lib/types";
import { ActivityChart } from "./ActivityChart";
import { StatusPie } from "./StatusPie";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
  href,
}: {
  label: string;
  value?: number;
  hint: string;
  icon: ReactNode;
  tone: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card interactive className="flex items-start gap-4 p-5">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tone)}>{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-2">{label}</p>
          {value === undefined ? (
            <Skeleton className="mt-2 h-9 w-16" />
          ) : (
            <p className="mt-1 text-[34px] font-semibold leading-none tracking-tight tabular-nums text-ink">
              {value.toLocaleString()}
            </p>
          )}
          <p className="mt-2 text-xs text-ink-3">{hint}</p>
        </div>
      </Card>
    </Link>
  );
}

function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", className)}>{children}</div>;
}

export function Dashboard() {
  const { data: session } = useSWR<SessionInfo>("/api/session");
  const dash = useSWR<DashboardData>("/api/dashboard");
  const epics = useSWR<Epic[]>("/api/epics?watched=1");
  const threads = useSWR<Thread[]>("/api/threads?limit=3");
  const acceptance = useSWR<Issue[]>("/api/tickets?view=acceptance&limit=24");
  const stats = dash.data?.stats;
  const firstName = session?.user.displayName.split(" ")[0];
  const hydrated = useHydrated();

  return (
    <div className="mx-auto max-w-[1440px] space-y-10 px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="h-5 text-sm font-medium text-ink-3">
            {hydrated &&
              new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-ink">
            {hydrated ? greeting() : "Welcome back"}
            {firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        {session?.mode === "demo" && (
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 transition hover:bg-amber-100"
          >
            <Plug className="size-4" />
            <span>
              Showing demo data.{" "}
              <span className="font-semibold">{session.liveAvailable ? "Switch back to your Jira" : "Connect your Jira site"}</span>
            </span>
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      {dash.error && <ErrorState error={dash.error} />}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Stale tickets"
          value={stats?.stale}
          hint={`Open with no updates in ${stats?.staleDays ?? 14}+ days`}
          icon={<Hourglass className="size-5" />}
          tone="bg-amber-100 text-amber-700"
          href="/tickets?view=open"
        />
        <StatCard
          label="Open tickets"
          value={stats?.open}
          hint="Not yet in a done status"
          icon={<CircleDot className="size-5" />}
          tone="bg-indigo-100 text-indigo-700"
          href="/tickets?view=open"
        />
        <StatCard
          label="Comments this week"
          value={stats?.commentsThisWeek}
          hint="On your tickets, last 7 days"
          icon={<MessageSquareText className="size-5" />}
          tone="bg-emerald-100 text-emerald-700"
          href="/chat"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col p-6 lg:col-span-2">
          <SectionHeader
            title="Opened vs. completed"
            subtitle={`Running total, last 30 days · completed = moved to ${dash.data?.completedStatuses.join(" or ") ?? "done"}`}
          />
          {dash.data ? <ActivityChart activity={dash.data.activity} /> : <Skeleton className="h-[280px]" />}
        </Card>
        <Card className="flex flex-col p-6">
          <SectionHeader title="By status" subtitle="All your tickets, current status" />
          {dash.data ? <StatusPie breakdown={dash.data.statusBreakdown} /> : <Skeleton className="h-[280px]" />}
        </Card>
      </section>

      <section>
        <SectionHeader
          title="Epics you're watching"
          action={
            <Link href="/epics" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              All epics <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        {epics.error ? (
          <ErrorState error={epics.error} />
        ) : !epics.data ? (
          <Grid>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[150px]" />
            ))}
          </Grid>
        ) : epics.data.length ? (
          <Grid>
            {epics.data.map((epic) => (
              <EpicCard key={epic.key} epic={epic} href={`/epics?key=${epic.key}`} />
            ))}
          </Grid>
        ) : (
          <EmptyState title="You're not watching any epics" hint="Watch an epic in Jira and it will show up here." />
        )}
      </section>

      <section>
        <SectionHeader
          title="Recent comments"
          action={
            <Link href="/chat" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              Open chat <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        {threads.error ? (
          <ErrorState error={threads.error} />
        ) : !threads.data ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        ) : threads.data.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {threads.data.map((t) => (
              <CommentCard key={t.issue.key} thread={t} href={`/chat?key=${t.issue.key}`} />
            ))}
          </div>
        ) : (
          <EmptyState title="No recent comments" hint="Comments on your tickets from the last 60 days show up here." />
        )}
      </section>

      <section>
        <SectionHeader title="Kanban" subtitle="Five most recently updated per column · drag a card to change its status" />
        <div className="scroll-thin overflow-x-auto pb-1">
          <KanbanBoard limit={5} />
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            href="/kanban"
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:bg-slate-800"
          >
            View Kanban board <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="pb-6">
        <SectionHeader title="Ready for acceptance" subtitle="Waiting on your sign-off" />
        {acceptance.error ? (
          <ErrorState error={acceptance.error} />
        ) : !acceptance.data ? (
          <Grid>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[130px]" />
            ))}
          </Grid>
        ) : acceptance.data.length ? (
          <Grid>
            {acceptance.data.map((issue) => (
              <IssueCard key={issue.key} issue={issue} href={`/tickets?key=${issue.key}`} />
            ))}
          </Grid>
        ) : (
          <EmptyState title="Nothing waiting for acceptance" />
        )}
      </section>
    </div>
  );
}
