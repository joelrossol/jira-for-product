"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, MessagesSquare, SquareKanban, Ticket, Zap } from "lucide-react";
import { cn } from "@/lib/format";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kanban", label: "Kanban", icon: SquareKanban },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/epics", label: "Epics", icon: Zap },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/todo", label: "To-do", icon: ListTodo },
];

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="relative z-20 flex w-[76px] shrink-0 flex-col items-center gap-1.5 border-r border-line bg-surface/70 py-5 backdrop-blur"
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex size-12 items-center justify-center rounded-2xl transition",
              active
                ? "bg-accent text-white shadow-[0_6px_16px_-6px_rgb(79_70_229/0.6)]"
                : "text-ink-3 hover:bg-accent-soft hover:text-accent",
            )}
          >
            <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 2} />
            <span className="pointer-events-none absolute left-[calc(100%+12px)] z-50 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-pop transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
