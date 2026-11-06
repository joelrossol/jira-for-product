import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { JiraError } from "./errors";
import { getProvider, type Provider } from "./provider";

/** Set by the demo data switch in Settings. Per browser, so it never changes what others see. */
export const DEMO_COOKIE = "jira-demo";

// Wraps a route handler: opts out of prerendering, picks the provider, and turns
// thrown errors into JSON responses with a sensible status code. `demo` overrides
// the cookie, for the request that changes it.
export async function respond<T>(fn: (p: Provider) => Promise<T>, opts: { demo?: boolean } = {}): Promise<Response> {
  await connection();
  try {
    const demo = opts.demo ?? (await cookies()).get(DEMO_COOKIE)?.value === "1";
    return Response.json(await fn(getProvider({ demo })));
  } catch (err) {
    const status = err instanceof JiraError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unexpected error";
    if (status >= 500) console.error(err);
    return Response.json({ error: message }, { status });
  }
}

const ISSUE_KEY = /^[A-Z][A-Z0-9_]*-\d+$/i;

export function issueKey(key: string): string {
  if (!ISSUE_KEY.test(key)) throw new JiraError(400, `"${key}" is not a valid issue key.`);
  return key.toUpperCase();
}

export function intParam(value: string | null, fallback: number, max: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : fallback;
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new JiraError(400, "Request body must be JSON.");
  }
}
