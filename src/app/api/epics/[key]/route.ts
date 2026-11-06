import type { NextRequest } from "next/server";
import { issueKey, respond } from "@/lib/api";
import { getEpic } from "@/lib/services";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/epics/[key]">) {
  const { key } = await ctx.params;
  return respond((p) => getEpic(p, issueKey(key)));
}
