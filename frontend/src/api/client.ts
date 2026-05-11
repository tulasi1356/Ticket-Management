const envOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, "").trim() ?? ""

/** In dev we default to relative URLs so Vite proxies to Rails (`vite.config.ts`). */
export const API_BASE_URL =
  envOrigin || (import.meta.env.DEV ? "" : "http://127.0.0.1:3000")

const USER_SESSION_KEY = "user";

function getStoredUserId(): number | null {
  try {
    const raw = sessionStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: unknown };
    const id = parsed?.id;
    return typeof id === "number" ? id : null;
  } catch {
    return null;
  }
}

function extractErrorFromBody(text: string, status: number): string {
  const trimmed = text.trim();
  if (!trimmed) return `Request failed (${status})`;

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const errMsg = parsed.error;
    if (typeof errMsg === "string" && errMsg.length > 0) return errMsg;

    const errors = parsed.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const parts = errors.map((e) => String(e)).filter(Boolean);
      if (parts.length) return parts.join("; ");
    }
  } catch {
  
  }

  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

/** @template T Parsed JSON body (defaults to any for legacy call sites). */
export const apiClient = async <T = any>(url: string, options?: RequestInit): Promise<T> => {
  const storedUserId = getStoredUserId();
  const body = options?.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const baseHeaders = new Headers(options?.headers ?? undefined);

  if (storedUserId) baseHeaders.set("X-User-Id", String(storedUserId));
  if (!isFormData && !baseHeaders.has("Content-Type")) {
    baseHeaders.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: baseHeaders,
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(extractErrorFromBody(raw, res.status));
  }

  if (raw.trim() === "") return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Unexpected response from server (not JSON)");
  }
};
