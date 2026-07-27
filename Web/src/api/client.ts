// Mirrors Frontend/LibraLink/src/services/api.ts's thin-fetch-wrapper shape so both clients
// talk to the same backend the same way. Base URL comes from VITE_API_BASE_URL (see
// .env.example) instead of a hardcoded LAN IP, since a web portal isn't run on a phone.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const TOKEN_KEY = "libralink_portal_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // default true
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const message =
      (data as { error?: string; message?: string })?.error ||
      (data as { error?: string; message?: string })?.message ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (res.status === 204) {
    return {} as T;
  }
  return data as T;
}

export const api = {
  get: <T>(endpoint: string, auth = true) => apiRequest<T>(endpoint, { method: "GET", auth }),
  post: <T>(endpoint: string, body?: unknown, auth = true) =>
    apiRequest<T>(endpoint, { method: "POST", body, auth }),
  put: <T>(endpoint: string, body?: unknown, auth = true) =>
    apiRequest<T>(endpoint, { method: "PUT", body, auth }),
  patch: <T>(endpoint: string, body?: unknown, auth = true) =>
    apiRequest<T>(endpoint, { method: "PATCH", body, auth }),
  delete: <T>(endpoint: string, auth = true) => apiRequest<T>(endpoint, { method: "DELETE", auth }),
};
