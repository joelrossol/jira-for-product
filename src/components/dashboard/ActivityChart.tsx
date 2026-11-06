"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dayKey } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const SERIES = [
  { key: "opened", daily: "openedDay", label: "Opened", color: "var(--color-series-1)" },
  { key: "completed", daily: "completedDay", label: "Moved to done", color: "var(--color-series-3)" },
] as const;

type Point = {
  day: string;
  label: string;
  /** Running totals across the window, which is what the lines plot. */
  opened: number;
  completed: number;
  /** That day's own counts, for the tooltip. */
  openedDay: number;
  completedDay: number;
};

// Buckets timestamps into the last 30 local days, then accumulates. Daily counts
// on a personal board are mostly 0s and 1s, which draw as spikes; running totals
// read as two lines whose gap is the net change in open work.
function bucket(activity: DashboardData["activity"]): Point[] {
  const days: Point[] = [];
  const index = new Map<string, Point>();
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const point = {
      day: dayKey(d),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      opened: 0,
      completed: 0,
      openedDay: 0,
      completedDay: 0,
    };
    days.push(point);
    index.set(point.day, point);
  }
  for (const ts of activity.opened) {
    const p = index.get(dayKey(new Date(ts)));
    if (p) p.openedDay++;
  }
  for (const ts of activity.completed) {
    const p = index.get(dayKey(new Date(ts)));
    if (p) p.completedDay++;
  }
  let opened = 0;
  let completed = 0;
  for (const p of days) {
    p.opened = opened += p.openedDay;
    p.completed = completed += p.completedDay;
  }
  return days;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="min-w-40 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-pop">
      <p className="mb-1.5 font-semibold text-ink">{point.label}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center gap-2 py-0.5 text-ink-2">
          <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
          <span className="flex-1">{s.label}</span>
          <span className="font-semibold tabular-nums text-ink">{point[s.key]}</span>
          <span className="w-7 text-right tabular-nums text-ink-3">+{point[s.daily]}</span>
        </p>
      ))}
      <p className="mt-1.5 border-t border-line pt-1.5 text-[11px] text-ink-3">Running total · +added that day</p>
    </div>
  );
}

export function ActivityChart({ activity }: { activity: DashboardData["activity"] }) {
  const data = useMemo(() => bucket(activity), [activity]);
  const totals = SERIES.map((s) => ({ ...s, total: data[data.length - 1][s.key] }));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        {totals.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: s.color }} />
            <span className="text-sm text-ink-2">{s.label}</span>
            <span className="text-sm font-semibold tabular-nums text-ink">{s.total}</span>
          </div>
        ))}
      </div>
      <div className="min-h-[240px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`activity-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: s.color, stopOpacity: 0.26 }} />
                  <stop offset="100%" style={{ stopColor: s.color, stopOpacity: 0.02 }} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="#edf0f5" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "#e5e8f0" }}
              tick={{ fill: "#8a94a8", fontSize: 12 }}
              interval={4}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#8a94a8", fontSize: 12 }}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#c3cad8", strokeWidth: 1, strokeDasharray: "3 3" }} />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotoneX"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#activity-fill-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: s.color }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
