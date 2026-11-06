"use client";

import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Ticket } from "lucide-react";
import { IssueCard } from "@/components/cards";
import { DetailSkeleton, IssueDetailView } from "@/components/IssueDetailView";
import { MasterDetail, Tabs } from "@/components/MasterDetail";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import type { Issue, IssueDetail } from "@/lib/types";

type View = "recent" | "open" | "acceptance";
const VIEWS: { value: View; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "open", label: "Open" },
  { value: "acceptance", label: "Acceptance" },
];

function TicketPanel({ issueKey }: { issueKey: string }) {
  const { data, error, mutate } = useSWR<IssueDetail>(`/api/tickets/${issueKey}`, { keepPreviousData: false });
  if (error) return <ErrorState error={error} className="m-8" />;
  if (!data) return <DetailSkeleton />;
  return <IssueDetailView issue={data} onChanged={(updated) => mutate(updated, { revalidate: false })} />;
}

export function TicketsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const view = VIEWS.find((v) => v.value === params.get("view"))?.value ?? "recent";
  const { data: list, error } = useSWR<Issue[]>(`/api/tickets?view=${view}&limit=100`);
  const selected = params.get("key") ?? list?.[0]?.key;
  const href = (key: string) => `/tickets?view=${view}&key=${key}`;

  return (
    <MasterDetail
      title="Tickets"
      subtitle={list ? `${list.length} tickets` : "Loading…"}
      toolbar={<Tabs value={view} options={VIEWS} onChange={(v) => router.replace(`/tickets?view=${v}`)} />}
      list={
        error ? (
          <ErrorState error={error} />
        ) : !list ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[118px]" />
            ))}
          </div>
        ) : list.length ? (
          <div className="space-y-2.5">
            {list.map((issue) => (
              <IssueCard key={issue.key} issue={issue} href={href(issue.key)} selected={issue.key === selected} />
            ))}
          </div>
        ) : (
          <EmptyState title="No tickets here" />
        )
      }
      detail={
        selected ? (
          <TicketPanel key={selected} issueKey={selected} />
        ) : list ? (
          <EmptyState
            title="Select a ticket"
            icon={<Ticket className="size-5" />}
            className="m-8 border-none bg-transparent"
          />
        ) : (
          <DetailSkeleton />
        )
      }
    />
  );
}
