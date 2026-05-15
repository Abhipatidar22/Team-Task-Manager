const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export function getToken() {
  return localStorage.getItem("ttm_token");
}

export function setToken(token: string | null) {
  if (!token) {
    localStorage.removeItem("ttm_token");
    return;
  }
  localStorage.setItem("ttm_token", token);
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token: string | null = getToken(),
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("accept", "application/json");

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
