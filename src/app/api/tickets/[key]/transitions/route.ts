import type { NextRequest } from "next/server";
import { issueKey, readJson, respond } from "@/lib/api";
import { JiraError } from "@/lib/errors";

type Ctx = RouteContext<"/api/tickets/[key]/transitions">;

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { key } = await ctx.params;
  return respond((p) => p.transitions(issueKey(key)));
}

// Body: { transitionId } from the status menu, or { toStatus } from a Kanban drop,
// which is resolved to whichever transition the workflow allows into that status.
export async function POST(request: NextRequest, ctx: Ctx) {
  const params = await ctx.params;
  return respond(async (p) => {
    const key = issueKey(params.key);
    const body = await readJson<{ transitionId?: unknown; toStatus?: unknown }>(request);
    let transitionId = body.transitionId;
    if (typeof body.toStatus === "string" && body.toStatus) {
      const target = body.toStatus.toLowerCase();
      const match = (await p.transitions(key)).find((t) => t.to.name.toLowerCase() === target);
      if (!match) {
        throw new JiraError(409, `Jira's workflow doesn't allow moving ${key} to "${body.toStatus}" from its current status.`);
      }
      transitionId = match.id;
    }
    if (typeof transitionId !== "string" || !transitionId) throw new JiraError(400, "transitionId or toStatus is required.");
    await p.transition(key, transitionId);
    return p.issue(key);
  });
}
