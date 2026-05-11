import { apiClient } from "./client";
import type { User } from "../types/user";

export const getUsers = (): Promise<User[]> => apiClient("/users");

export const searchUsers = (
  query: string,
  opts?: { projectId?: number | null }
): Promise<User[]> => {
  const params = new URLSearchParams({ query })
  const pid = opts?.projectId
  if (pid != null && Number.isFinite(pid)) {
    params.set("project_id", String(pid))
  }
  return apiClient(`/users/search?${params.toString()}`, {
    method: "GET",
  })
}

export const createUser = (data: any) =>
  apiClient("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const findUserByEmail = (email: string): Promise<User> => apiClient(`/users/find_by_email?email=${encodeURIComponent(email)}`, {
  method: "GET",
});