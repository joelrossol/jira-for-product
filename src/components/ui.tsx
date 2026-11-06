"use client";

import {
  AlertTriangle,
  Bookmark,
  Bug,
  ChevronDown,
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronsDown,
  GitBranch,
  Inbox,
  SquareCheck,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn, initials } from "@/lib/format";
import type { IssueType, Status, StatusCategory, User } from "@/lib/types";

export function Card({
  children,
  className,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-card",
        interactive && "transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const AVATAR_TONES = [
  "bg-indigo-100 text-indigo-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];

function tone(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

export function Avatar({ user, size = 32, className }: { user?: User; size?: number; className?: string }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.38) };
  if (!user) {
    return (
      <span
        style={style}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong bg-canvas text-ink-3",
          className,
        )}
        title="Unassigned"
      >
        ?
      </span>
    );
  }
  if (user.avatarUrl && !broken) {
    return (
      // Jira avatar hosts vary by site, so a plain <img> avoids next/image domain config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        title={user.displayName}
        width={size}
        height={size}
        style={style}
        onError={() => setBroken(true)}
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-white", className)}
      />
    );
  }
  return (
    <span
      style={style}
      title={user.displayName}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ring-2 ring-white",
        tone(user.accountId),
        className,
      )}
    >
      {initials(user.displayName)}
    </span>
  );
}

export const CATEGORY_STYLES: Record<StatusCategory, { pill: string; dot: string; label: string }> = {
  new: { pill: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400", label: "To do" },
  indeterminate: { pill: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500", label: "In progress" },
  done: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", label: "Done" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const s = CATEGORY_STYLES[status.category];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.pill,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", s.dot)} />
      <span className="truncate">{status.name}</span>
    </span>
  );
}

export function IssueTypeIcon({ type, className }: { type: IssueType; className?: string }) {
  const name = type.name.toLowerCase();
  const [Icon, color] = type.isEpic
    ? [Zap, "bg-violet-100 text-violet-600"]
    : name.includes("bug")
      ? [Bug, "bg-rose-100 text-rose-600"]
      : name.includes("story")
        ? [Bookmark, "bg-emerald-100 text-emerald-600"]
        : type.isSubtask
          ? [GitBranch, "bg-sky-100 text-sky-600"]
          : [SquareCheck, "bg-blue-100 text-blue-600"];
  return (
    <span
      title={type.name}
      className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-md", color, className)}
    >
      <Icon className="size-3" strokeWidth={2.5} />
    </span>
  );
}

export function PriorityIcon({ name }: { name?: string }) {
  if (!name) return null;
  const n = name.toLowerCase();
  const [Icon, color] =
    n === "highest" || n === "blocker"
      ? [ChevronsUp, "text-rose-600"]
      : n === "high" || n === "critical"
        ? [ChevronUp, "text-orange-500"]
        : n === "low"
          ? [ChevronDown, "text-sky-500"]
          : n === "lowest" || n === "trivial"
            ? [ChevronsDown, "text-sky-400"]
            : [Equal, "text-amber-500"];
  return (
    <span title={`${name} priority`} className={cn("inline-flex", color)}>
      <Icon className="size-4" strokeWidth={2.5} />
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-slate-200/60", className)}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
  className,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-canvas text-ink-3">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <p className="text-sm font-medium text-ink-2">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export function ErrorState({ error, className }: { error: unknown; className?: string }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">Couldn&apos;t load this from Jira</p>
        <p className="mt-0.5 text-rose-700/90">{message}</p>
      </div>
    </div>
  );
}

export function ProgressBar({
  done,
  inProgress,
  total,
  className,
}: {
  done: number;
  inProgress: number;
  total: number;
  className?: string;
}) {
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  return (
    <div className={cn("flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100", className)}>
      {done > 0 && <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct(done)}%` }} />}
      {inProgress > 0 && (
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct(inProgress)}%` }} />
      )}
    </div>
  );
}
