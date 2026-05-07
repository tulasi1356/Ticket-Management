const BASE_URL = "http://localhost:3000";

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

export const apiClient = async (url: string, options?: RequestInit) => {
  const storedUserId = getStoredUserId();

  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(storedUserId ? { "X-User-Id": String(storedUserId) } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error("API Error");
  }

  return res.json();
};