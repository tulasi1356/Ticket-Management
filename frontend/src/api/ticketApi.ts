import { apiClient } from "./client";

export const createTicket = (data: any) => apiClient("/tickets", {
    method: "POST",
    body: JSON.stringify(data),
})

export const getTickets = () => apiClient("/tickets", {
    method: "GET",
})

export type UpdateTicketPayload = {
  title?: string
  description?: string | null
  status?: string
  priority?: string
  issue_type?: string
  assignee_id?: number
  start_date?: string | null
  end_date?: string | null
  attachment_urls?: string[]
}

export const updateTicket = (id: number, data: UpdateTicketPayload) =>
  apiClient(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })

export type TicketExportResponse = {
  message: string
  job_id?: string
}

/** Admin-only: queues a Sidekiq job that emails a full project / sprint / ticket export (CSV attached). */
export const requestTicketExport = () =>
  apiClient<TicketExportResponse>("/tickets/export", {
    method: "POST",
    body: JSON.stringify({}),
  })