import { apiClient } from "./client";

export const getProjects = () => apiClient("/projects")

export const createProject =  (data: any) => apiClient("/projects", {
    method: "POST",
    body: JSON.stringify(data),
})

export const assignUsersToProject = (data: { id: number; user_ids: number[] }) =>
  apiClient("/projects/assign_users_to_project", {
    method: "POST",
    body: JSON.stringify(data),
  })

export const editProject = (data: { id: number; name: string; description: string }) =>
  apiClient("/projects/edit_project", {
    method: "PUT",
    body: JSON.stringify(data),
  })

export const getProject = (id: number) => apiClient(`/projects/get_project?id=${id}`)  


export const deleteProject = (id: number) => apiClient("/projects/destroy_project", {
    body: JSON.stringify({ id: id }),
    method: "DELETE",
})