"use client";

import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Zap } from "lucide-react";
import { EpicCard } from "@/components/cards";
import { DetailSkeleton, IssueDetailView } from "@/components/IssueDetailView";
import { MasterDetail, Tabs } from "@/components/MasterDetail";
import { Card, EmptyState, ErrorState, ProgressBar, Skeleton } from "@/components/ui";
import type { Epic, EpicDetail } from "@/lib/types";

type Filter = "all" | "watching";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All epics" },
  { value: "watching", label: "Watching" },
];

function Progress({ epic }: { epic: EpicDetail }) {
  const { total, done, inProgress, todo } = epic.progress;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const stats = [
    { label: "To do", value: todo, dot: "bg-slate-400" },
    { label: "In progress", value: inProgress, dot: "bg-blue-500" },
    { label: "Done", value: done, dot: "bg-emerald-500" },
  ];
  return (
    <Card className="p-6">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Progress</h3>
          <p className="mt-0.5 text-sm text-ink-3">
            {done} of {total} child issues done
          </p>
        </div>
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink">{pct}%</span>
      </div>
      <ProgressBar done={done} inProgress={inProgress} total={total} className="mt-4 h-2.5" />
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {stats.map((s) => (
          <span key={s.label} className="flex items-center gap-2 text-sm text-ink-2">
            <span className={`size-2 rounded-full ${s.dot}`} />
            {s.label}
            <span className="font-semibold tabular-nums text-ink">{s.value}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

function EpicPanel({ epicKey }: { epicKey: string }) {
  const { data, error, mutate } = useSWR<EpicDetail>(`/api/epics/${epicKey}`, { keepPreviousData: false });
  if (error) return <ErrorState error={error} className="m-8" />;
  if (!data) return <DetailSkeleton />;
  return (
    <IssueDetailView
      issue={data}
      onChanged={(updated) => mutate((prev) => prev && { ...prev, ...updated }, { revalidate: false })}
      relatedTitle="Tickets in this epic"
      relatedEmpty="No tickets in this epic yet."
    >
      <Progress epic={data} />
    </IssueDetailView>
  );
}

export function EpicsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const filter: Filter = params.get("filter") === "watching" ? "watching" : "all";
  const { data: list, error } = useSWR<Epic[]>(filter === "watching" ? "/api/epics?watched=1" : "/api/epics");
  const selected = params.get("key") ?? list?.[0]?.key;
  const href = (key: string) => `/epics?filter=${filter}&key=${key}`;

  return (
    <MasterDetail
      title="Epics"
      subtitle={list ? `${list.length} epics` : "Loading…"}
      toolbar={<Tabs value={filter} options={FILTERS} onChange={(f) => router.replace(`/epics?filter=${f}`)} />}
      list={
        error ? (
          <ErrorState error={error} />
        ) : !list ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-[140px]" />
            ))}
          </div>
        ) : list.length ? (
          <div className="space-y-2.5">
            {list.map((epic) => (
              <EpicCard key={epic.key} epic={epic} href={href(epic.key)} selected={epic.key === selected} />
            ))}
          </div>
        ) : (
          <EmptyState title={filter === "watching" ? "You're not watching any epics" : "No epics found"} />
        )
      }
      detail={
        selected ? (
          <EpicPanel key={selected} epicKey={selected} />
        ) : list ? (
          <EmptyState title="Select an epic" icon={<Zap className="size-5" />} className="m-8 border-none bg-transparent" />
        ) : (
          <DetailSkeleton />
        )
      }
    />
  );
}
