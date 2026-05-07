import { apiClient } from "./client";
import type { User } from "../types/user";

export const getUsers = (): Promise<User[]> => apiClient("/users");

export const searchUsers = (query: string): Promise<User[]> =>
  apiClient(`/users/search?query=${encodeURIComponent(query)}`, {
    method: "GET",
  });

export const createUser = (data: any) =>
  apiClient("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const findUserByEmail = (email: string): Promise<User> => apiClient(`/users/find_by_email?email=${encodeURIComponent(email)}`, {
  method: "GET",
});