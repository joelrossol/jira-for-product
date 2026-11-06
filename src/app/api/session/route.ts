import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { DEMO_COOKIE, respond } from "@/lib/api";
import { getSession } from "@/lib/services";

export function GET() {
  return respond(getSession);
}

// Body: { demo: boolean }. Switches this browser between demo data and live Jira.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { demo?: unknown };
  if (typeof body.demo !== "boolean") {
    return Response.json({ error: "demo must be true or false." }, { status: 400 });
  }
  const store = await cookies();
  if (body.demo) {
    store.set(DEMO_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
    });
  } else {
    store.delete(DEMO_COOKIE);
  }
  return respond(getSession, { demo: body.demo });
}
