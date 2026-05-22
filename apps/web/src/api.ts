const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD
    ? "/api"
    : "http://localhost:3000/api");

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

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      message: "Something went wrong",
    }));

    throw new Error(error.message || "API request failed");
  }

  return res.json();
}