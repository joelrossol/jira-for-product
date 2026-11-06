import { mutate } from "swr";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export async function fetcher<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url));
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  return parse<T>(
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

/** After a write, refresh every cached API response so all widgets agree. */
export function refreshAll() {
  return mutate((key) => typeof key === "string" && key.startsWith("/api/"));
}

/** Drop cached API responses (all but `keep`) and refetch, e.g. after switching data source. */
export function resetAll(keep?: string) {
  return mutate((key) => typeof key === "string" && key.startsWith("/api/") && key !== keep, undefined, {
    revalidate: true,
  });
}
