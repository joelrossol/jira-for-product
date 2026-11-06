import type { NextRequest } from "next/server";
import { respond } from "@/lib/api";
import { listEpics } from "@/lib/services";

export function GET(request: NextRequest) {
  const watched = request.nextUrl.searchParams.get("watched") === "1";
  return respond((p) => listEpics(p, watched));
}
