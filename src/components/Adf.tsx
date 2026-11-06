import { Fragment, type ReactNode } from "react";
import type { AdfNode } from "@/lib/types";

// Renders Atlassian Document Format as React elements (no HTML injection).
// Covers the node types Jira's editor produces in descriptions and comments.

function safeHref(href: unknown): string | undefined {
  if (typeof href !== "string") return undefined;
  return /^(https?:|mailto:)/i.test(href) ? href : undefined;
}

function applyMarks(text: ReactNode, marks: AdfNode["marks"] = []): ReactNode {
  return marks.reduce<ReactNode>((acc, mark) => {
    switch (mark.type) {
      case "strong":
        return <strong className="font-semibold text-ink">{acc}</strong>;
      case "em":
        return <em>{acc}</em>;
      case "underline":
        return <u>{acc}</u>;
      case "strike":
        return <s>{acc}</s>;
      case "code":
        return (
          <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-rose-600">{acc}</code>
        );
      case "link": {
        const href = safeHref(mark.attrs?.href);
        return href ? (
          <a href={href} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
            {acc}
          </a>
        ) : (
          acc
        );
      }
      case "subsup":
        return mark.attrs?.type === "sup" ? <sup>{acc}</sup> : <sub>{acc}</sub>;
      default:
        return acc;
    }
  }, text);
}

function children(node: AdfNode): ReactNode {
  return node.content?.map((child, i) => <Fragment key={i}>{render(child)}</Fragment>);
}

function render(node: AdfNode): ReactNode {
  switch (node.type) {
    case "doc":
      return children(node);
    case "text":
      return applyMarks(node.text, node.marks);
    case "paragraph":
      return <p className="leading-relaxed [&:not(:first-child)]:mt-3">{children(node)}</p>;
    case "heading": {
      const level = Number(node.attrs?.level ?? 3);
      const cls =
        level <= 2
          ? "mt-6 mb-2 text-lg font-semibold text-ink first:mt-0"
          : "mt-5 mb-2 text-[15px] font-semibold text-ink first:mt-0";
      return level <= 2 ? <h3 className={cls}>{children(node)}</h3> : <h4 className={cls}>{children(node)}</h4>;
    }
    case "bulletList":
      return <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-ink-3">{children(node)}</ul>;
    case "orderedList":
      return <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-ink-3">{children(node)}</ol>;
    case "listItem":
      return <li className="[&>p]:mt-0">{children(node)}</li>;
    case "taskList":
      return <ul className="mt-2 space-y-1">{children(node)}</ul>;
    case "taskItem":
      return (
        <li className="flex items-start gap-2">
          <input type="checkbox" readOnly checked={node.attrs?.state === "DONE"} className="mt-1 accent-indigo-600" />
          <span>{children(node)}</span>
        </li>
      );
    case "blockquote":
      return <blockquote className="mt-3 border-l-4 border-line-strong pl-4 text-ink-2">{children(node)}</blockquote>;
    case "codeBlock":
      return (
        <pre className="scroll-thin mt-3 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-[13px] leading-relaxed text-slate-100">
          <code>{node.content?.map((c) => c.text).join("")}</code>
        </pre>
      );
    case "rule":
      return <hr className="my-5 border-line" />;
    case "hardBreak":
      return <br />;
    case "mention":
      return (
        <span className="rounded-md bg-accent-soft px-1 py-0.5 font-medium text-accent">
          {String(node.attrs?.text ?? "@someone")}
        </span>
      );
    case "emoji":
      return <span>{String(node.attrs?.text ?? node.attrs?.shortName ?? "")}</span>;
    case "status":
      return (
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-ink-2">
          {String(node.attrs?.text ?? "")}
        </span>
      );
    case "date": {
      const ts = Number(node.attrs?.timestamp);
      return <span className="rounded-md bg-slate-100 px-1.5 py-0.5">{ts ? new Date(ts).toLocaleDateString() : ""}</span>;
    }
    case "inlineCard":
    case "blockCard":
    case "embedCard": {
      const href = safeHref(node.attrs?.url);
      return href ? (
        <a href={href} target="_blank" rel="noreferrer" className="break-all font-medium text-accent hover:underline">
          {href}
        </a>
      ) : null;
    }
    case "panel": {
      const tones: Record<string, string> = {
        info: "border-blue-200 bg-blue-50",
        note: "border-violet-200 bg-violet-50",
        success: "border-emerald-200 bg-emerald-50",
        warning: "border-amber-200 bg-amber-50",
        error: "border-rose-200 bg-rose-50",
      };
      return (
        <div className={`mt-3 rounded-xl border p-4 ${tones[String(node.attrs?.panelType)] ?? tones.info}`}>
          {children(node)}
        </div>
      );
    }
    case "table":
      return (
        <div className="scroll-thin mt-3 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <tbody>{children(node)}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr className="border-b border-line last:border-0">{children(node)}</tr>;
    case "tableHeader":
      return <th className="bg-canvas px-3 py-2 font-semibold [&>p]:mt-0">{children(node)}</th>;
    case "tableCell":
      return <td className="px-3 py-2 align-top [&>p]:mt-0">{children(node)}</td>;
    case "mediaSingle":
    case "mediaGroup":
      return (
        <div className="mt-3 inline-flex rounded-lg border border-dashed border-line-strong px-3 py-2 text-xs text-ink-3">
          Attachment — open in Jira to view
        </div>
      );
    case "expand":
    case "nestedExpand":
      return (
        <details className="mt-3 rounded-xl border border-line p-3">
          <summary className="cursor-pointer font-medium">{String(node.attrs?.title ?? "Details")}</summary>
          <div className="mt-2">{children(node)}</div>
        </details>
      );
    default:
      return children(node);
  }
}

export function Adf({ doc, className }: { doc: AdfNode | null | undefined; className?: string }) {
  if (!doc?.content?.length) return null;
  return <div className={className}>{render(doc)}</div>;
}
