import type { AdfNode } from "./types";

// Flattens an ADF document to plain text, for previews and snippets.
export function adfToText(node: AdfNode | null | undefined): string {
  if (!node) return "";
  switch (node.type) {
    case "text":
      return node.text ?? "";
    case "hardBreak":
      return "\n";
    case "mention":
      return String(node.attrs?.text ?? "@someone");
    case "emoji":
      return String(node.attrs?.text ?? node.attrs?.shortName ?? "");
    case "inlineCard":
    case "blockCard":
      return String(node.attrs?.url ?? "");
    case "mediaSingle":
    case "mediaGroup":
    case "media":
      return "[attachment]";
  }
  const inner = (node.content ?? []).map(adfToText).join(node.type === "doc" ? "\n" : "");
  const isBlock = ["paragraph", "heading", "listItem", "codeBlock", "blockquote"].includes(node.type);
  return isBlock ? `${inner}\n` : inner;
}

export function adfSnippet(node: AdfNode | null | undefined, max = 160): string {
  const text = adfToText(node).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// Turns a plain-text message into ADF: blank lines split paragraphs,
// single newlines become hard breaks.
export function textToAdf(text: string): AdfNode {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    type: "doc",
    version: 1,
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: p.split("\n").flatMap((line, i): AdfNode[] => {
        const parts: AdfNode[] = line ? [{ type: "text", text: line }] : [];
        return i === 0 ? parts : [{ type: "hardBreak" }, ...parts];
      }),
    })),
  };
}
