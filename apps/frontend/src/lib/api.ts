/**
 * Central fetch wrapper.
 * - Always sends cookies (credentials: "include")
 * - On 401: attempts one token refresh, then retries the original request
 * - On second 401: redirects to /login
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

async function tryRefresh(): Promise<boolean> {
  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const ok = res.ok;
    refreshQueue.forEach((cb) => cb(ok));
    refreshQueue = [];
    return ok;
  } catch {
    refreshQueue.forEach((cb) => cb(false));
    refreshQueue = [];
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function apiFetch(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = input.startsWith("http") ? input : `${API}${input}`;

  const res = await fetch(url, { ...init, credentials: "include" });

  if (res.status !== 401) return res;

  // Try refresh
  const refreshed = await tryRefresh();
  if (!refreshed) {
    window.location.href = "/login";
    return res;
  }

  // Retry original request once
  const retry = await fetch(url, { ...init, credentials: "include" });
  if (retry.status === 401) {
    window.location.href = "/login";
  }
  return retry;
}
