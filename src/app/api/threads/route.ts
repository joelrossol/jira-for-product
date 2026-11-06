import type { NextRequest } from "next/server";
import { intParam, respond } from "@/lib/api";
import { getThreads } from "@/lib/services";

export function GET(request: NextRequest) {
  const limit = intParam(request.nextUrl.searchParams.get("limit"), 30, 100);
  return respond((p) => getThreads(p, limit));
}
