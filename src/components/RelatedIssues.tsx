"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/format";
import type { RelatedIssue } from "@/lib/types";
import { Card, IssueTypeIcon, StatusBadge } from "./ui";

const hrefFor = (i: RelatedIssue) => (i.issueType.isEpic ? `/epics?key=${i.key}` : `/tickets?key=${i.key}`);

function relationTone(relation: string) {
  if (relation === "Epic") return "bg-violet-50 text-violet-700 ring-violet-200";
  if (relation === "Parent" || relation === "Subtask" || relation === "Child issue") {
    return "bg-indigo-50 text-indigo-700 ring-indigo-200";
  }
  if (relation.startsWith("Blocks")) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (relation.startsWith("Is blocked")) return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

export function RelatedIssues({ title, items, empty }: { title: string; items: RelatedIssue[]; empty: string }) {
  const router = useRouter();
  return (
    <Card className="overflow-hidden">
      <h3 className="px-6 pb-4 pt-5 text-sm font-semibold text-ink">
        {title} <span className="font-normal text-ink-3">· {items.length}</span>
      </h3>
      {items.length ? (
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-y border-line bg-canvas/70 text-left text-[11px] uppercase tracking-wide text-ink-3">
                <th className="w-36 px-6 py-2.5 font-semibold">ID</th>
                <th className="px-3 py-2.5 font-semibold">Name</th>
                <th className="w-44 px-3 py-2.5 font-semibold">Relationship</th>
                <th className="w-44 px-6 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((item) => (
                <tr
                  key={`${item.relation}:${item.key}`}
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest("a")) router.push(hrefFor(item), { scroll: false });
                  }}
                  className="group cursor-pointer transition-colors hover:bg-canvas/70"
                >
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap font-semibold text-ink-2">
                      <IssueTypeIcon type={item.issueType} />
                      {item.key}
                    </span>
                  </td>
                  <td className="max-w-0 px-3 py-3">
                    <Link
                      href={hrefFor(item)}
                      scroll={false}
                      className="block truncate font-medium text-ink group-hover:text-accent"
                    >
                      {item.summary}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                        relationTone(item.relation),
                      )}
                    >
                      {item.relation}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="border-t border-line px-6 py-5 text-sm text-ink-3">{empty}</p>
      )}
    </Card>
  );
}
