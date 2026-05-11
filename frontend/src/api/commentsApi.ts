import { apiClient } from "./client"
import type { TicketComment } from "../pages/ticketing/types"

export type CreateCommentBody = {
  ticket_id: number
  message: string
  attachment_urls?: string[]
}

export async function fetchTicketComments(ticketId: number): Promise<TicketComment[]> {
  return apiClient(`/comments?ticket_id=${ticketId}`) as Promise<TicketComment[]>
}

export async function createComment(body: CreateCommentBody): Promise<TicketComment> {
  return apiClient("/comments", {
    method: "POST",
    body: JSON.stringify({
      ticket_id: body.ticket_id,
      message: body.message,
      attachment_urls: body.attachment_urls ?? [],
    }),
  }) as Promise<TicketComment>
}
