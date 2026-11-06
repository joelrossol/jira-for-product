import type { NextRequest } from "next/server";
import { issueKey, respond } from "@/lib/api";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/tickets/[key]">) {
  const { key } = await ctx.params;
  return respond((p) => p.issue(issueKey(key)));
}
