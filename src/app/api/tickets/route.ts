import type { NextRequest } from "next/server";
import { intParam, respond } from "@/lib/api";
import { listTickets } from "@/lib/services";

const VIEWS = ["recent", "acceptance", "open"] as const;

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const view = VIEWS.find((v) => v === params.get("view")) ?? "recent";
  const limit = intParam(params.get("limit"), 50, 500);
  return respond((p) => listTickets(p, view, limit));
}
