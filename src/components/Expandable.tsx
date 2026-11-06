"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

/**
 * Clips content to `lines` lines with a fade and an "Expand details" button that
 * animates it open. `className` should set the text size and line height, since
 * the clip height is measured from them.
 */
export function Expandable({
  lines = 25,
  className,
  children,
}: {
  lines?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Collapsed height in px, set only when the content is long enough to clip.
  const [limit, setLimit] = useState<number>();
  const [full, setFull] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 24;
      const max = Math.round(lineHeight * lines);
      setFull(el.scrollHeight);
      // Don't bother clipping for the sake of a line or two.
      setLimit(el.scrollHeight > max + lineHeight * 3 ? max : undefined);
    };
    measure();
    // The wrapper's own height is clamped, so watch the content inside it.
    const observer = new ResizeObserver(measure);
    observer.observe(el.firstElementChild ?? el);
    return () => observer.disconnect();
  }, [lines]);

  const clipped = limit !== undefined;

  function toggle() {
    setExpanded((open) => !open);
    // Collapsing from far down the page would leave the reader below the text.
    if (expanded && ref.current && ref.current.getBoundingClientRect().top < 0) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={ref}
          style={clipped ? { maxHeight: expanded ? full : limit } : undefined}
          className={cn(
            "overflow-hidden transition-[max-height] duration-500 ease-in-out motion-reduce:transition-none",
            className,
          )}
        >
          {children}
        </div>
        {clipped && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-surface transition-opacity duration-500",
              expanded && "opacity-0",
            )}
          />
        )}
      </div>
      {clipped && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-2 shadow-card transition hover:border-line-strong hover:text-ink"
          >
            {expanded ? "Collapse details" : "Expand details"}
            <ChevronDown className={cn("size-4 transition-transform duration-300", expanded && "rotate-180")} />
          </button>
        </div>
      )}
    </div>
  );
}
