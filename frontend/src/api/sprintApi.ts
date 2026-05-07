import { apiClient } from "./client"

export const createSprint = (data: any) => apiClient("/sprints", {
    method: "POST",
    body: JSON.stringify(data),
})

export const getSprints = () => apiClient("/sprints", {
    method: "GET",
})