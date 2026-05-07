import { apiClient } from "./client";

export const createTicket = (data: any) => apiClient("/tickets", {
    method: "POST",
    body: JSON.stringify(data),
})

export const getTickets = () => apiClient("/tickets", {
    method: "GET",
})