"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { CircleUserRound, ExternalLink, Search, Settings, SquareKanban } from "lucide-react";
import { Avatar } from "@/components/ui";
import type { SessionInfo } from "@/lib/types";

export function Header() {
  const { data: session } = useSWR<SessionInfo>("/api/session");
  const searchRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <header className="relative z-30 grid h-20 shrink-0 grid-cols-[minmax(max-content,1fr)_minmax(0,560px)_minmax(max-content,1fr)] items-center gap-6 border-b border-line bg-surface px-6">
      <Link href="/" className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_6px_16px_-6px_rgb(124_58_237/0.7)]">
          <SquareKanban className="size-5" strokeWidth={2.25} />
        </span>
        <span className="whitespace-nowrap text-lg font-semibold tracking-tight text-ink">Joel&apos;s Jira Dashboard</span>
        {session?.mode === "demo" && (
          <span className="hidden shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 lg:inline">
            Demo data
          </span>
        )}
      </Link>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-ink-3" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search tickets, epics and comments…"
          aria-label="Search"
          className="h-11 w-full rounded-xl border border-line bg-canvas pl-11 pr-16 text-sm text-ink placeholder:text-ink-3 outline-none transition focus:border-accent/40 focus:bg-surface focus:ring-4 focus:ring-accent/10"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px] font-medium text-ink-3">
          ⌘K
        </kbd>
      </form>

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex size-11 items-center justify-center rounded-xl text-ink-2 transition hover:bg-canvas hover:text-ink"
        >
          <Settings className="size-[22px]" />
        </Link>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Account"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex size-11 items-center justify-center rounded-xl text-ink-2 transition hover:bg-canvas hover:text-ink"
          >
            <CircleUserRound className="size-[26px]" strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-2xl border border-line bg-surface p-4 shadow-pop">
              {session ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar user={session.user} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{session.user.displayName}</p>
                      <p className="truncate text-xs text-ink-3">{session.user.email ?? "Jira Cloud account"}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
                    {session.siteUrl && (
                      <a
                        href={session.siteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-ink-2 hover:bg-canvas"
                      >
                        Open Jira <ExternalLink className="size-3.5" />
                      </a>
                    )}
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-ink-2 hover:bg-canvas"
                    >
                      Connection settings <Settings className="size-3.5" />
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-3">Loading account…</p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
