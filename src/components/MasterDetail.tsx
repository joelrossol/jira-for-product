import type { ReactNode } from "react";

// Two-pane layout used by Tickets, Epics and Chat: a scrolling list of tiles on
// the left and the selected item's detail on the right.
export function MasterDetail({
  title,
  subtitle,
  toolbar,
  list,
  detail,
}: {
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  list: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <aside className="scroll-thin flex max-h-[45vh] shrink-0 flex-col border-b border-line lg:max-h-none lg:w-[380px] lg:border-b-0 lg:border-r">
        <div className="border-b border-line px-5 pb-4 pt-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-3">{subtitle}</p>}
          {toolbar && <div className="mt-4">{toolbar}</div>}
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-4">{list}</div>
      </aside>
      <section className="scroll-thin min-h-0 min-w-0 flex-1 overflow-y-auto">{detail}</section>
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-card">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={
            o.value === value
              ? "rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white"
              : "rounded-lg px-3 py-1.5 text-xs font-medium text-ink-2 hover:text-ink"
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
