"use client";

import { useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

// Validated categorical order; assigned to statuses in their stable sort order.
const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const OTHER = "#8a94a8";

type Slice = { name: string; value: number; fill: string };

function slices(breakdown: DashboardData["statusBreakdown"]): Slice[] {
  const named = breakdown.slice(0, PALETTE.length).map((s, i) => ({
    name: s.status,
    value: s.count,
    fill: PALETTE[i],
  }));
  const rest = breakdown.slice(PALETTE.length).reduce((sum, s) => sum + s.count, 0);
  return rest ? [...named, { name: "Other", value: rest, fill: OTHER }] : named;
}

function SliceTooltip({ active, payload, total }: { active?: boolean; payload?: { payload: Slice }[]; total: number }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="flex items-center gap-2 font-semibold text-ink">
        <span className="size-2 rounded-full" style={{ background: s.fill }} />
        {s.name}
      </p>
      <p className="mt-1 text-ink-2">
        <span className="font-semibold tabular-nums text-ink">{s.value}</span> tickets ·{" "}
        {Math.round((s.value / total) * 100)}%
      </p>
    </div>
  );
}

export function StatusPie({ breakdown }: { breakdown: DashboardData["statusBreakdown"] }) {
  const data = slices(breakdown);
  const total = data.reduce((sum, s) => sum + s.value, 0);
  const [hover, setHover] = useState<string | null>(null);

  if (!total) return <p className="py-16 text-center text-sm text-ink-3">No tickets yet.</p>;

  return (
    <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-stretch 2xl:flex-row 2xl:items-center">
      <div className="relative mx-auto aspect-square w-full max-w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="100%"
              stroke="#fff"
              strokeWidth={2}
              cornerRadius={4}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              onMouseEnter={(s: { name?: string }) => setHover(s.name ?? null)}
              onMouseLeave={() => setHover(null)}
            />
            <Tooltip content={<SliceTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink">{total}</span>
          <span className="text-xs text-ink-3">tickets</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1">
        {data.map((s) => (
          <li
            key={s.name}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2 py-1 text-sm transition",
              hover === s.name && "bg-canvas",
            )}
          >
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.fill }} />
            <span className="min-w-0 flex-1 truncate text-ink-2">{s.name}</span>
            <span className="font-semibold tabular-nums text-ink">{s.value}</span>
            <span className="w-9 text-right text-xs tabular-nums text-ink-3">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
