import { apiClient } from "./client"
import type { BoardView, Ticket } from "../pages/ticketing/types"

export const createTicket = (data: any) =>
  apiClient("/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  })

export type TicketsBoardMeta = {
  page: number
  per_page: number
  total: number
  total_pages: number
  has_more: boolean
}

export type TicketsBoardStats = {
  total: number
  todo: number
  done: number
  high_priority: number
}

export type TicketsBoardResponse = {
  tickets: Ticket[]
  meta: TicketsBoardMeta
  stats: TicketsBoardStats
}

export type GetTicketsBoardArgs = {
  project_id: number
  board_view: BoardView
  sprint_id?: number | null
  q?: string
  priorities?: string[]
  statuses?: string[]
  assignee_ids?: number[]
  date_from?: string
  date_to?: string
  page?: number
}

function appendCsv(sp: URLSearchParams, key: string, values: string[]) {
  if (values.length === 0) return
  sp.set(key, values.join(","))
}

function appendIds(sp: URLSearchParams, key: string, ids: number[]) {
  if (ids.length === 0) return
  sp.set(key, ids.join(","))
}

/** Paginated, filtered board tickets (20 per page). */
export async function getTicketsBoard(args: GetTicketsBoardArgs): Promise<TicketsBoardResponse> {
  const sp = new URLSearchParams()
  sp.set("project_id", String(args.project_id))
  sp.set("board_view", args.board_view)
  if (args.sprint_id != null && args.sprint_id > 0) {
    sp.set("sprint_id", String(args.sprint_id))
  }
  if (args.q?.trim()) sp.set("q", args.q.trim())
  appendCsv(sp, "priorities", args.priorities ?? [])
  appendCsv(sp, "statuses", args.statuses ?? [])
  appendIds(sp, "assignee_ids", args.assignee_ids ?? [])
  if (args.date_from) sp.set("date_from", args.date_from)
  if (args.date_to) sp.set("date_to", args.date_to)
  sp.set("page", String(args.page ?? 1))

  return apiClient<TicketsBoardResponse>(`/tickets?${sp.toString()}`, {
    method: "GET",
  })
}

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