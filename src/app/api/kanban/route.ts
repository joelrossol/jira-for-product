import type { NextRequest } from "next/server";
import { intParam, respond } from "@/lib/api";
import { getKanban } from "@/lib/services";

export function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get("limit");
  return respond((p) => getKanban(p, limit ? intParam(limit, 5, 500) : undefined));
}
