import type { NextRequest } from "next/server";
import { issueKey, readJson, respond } from "@/lib/api";
import { JiraError } from "@/lib/errors";

type Ctx = RouteContext<"/api/tickets/[key]/comments">;

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { key } = await ctx.params;
  return respond((p) => p.comments(issueKey(key)));
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { key } = await ctx.params;
  return respond(async (p) => {
    const { text } = await readJson<{ text?: unknown }>(request);
    if (typeof text !== "string" || !text.trim()) throw new JiraError(400, "Comment text is required.");
    return p.addComment(issueKey(key), text.slice(0, 32_000));
  });
}
