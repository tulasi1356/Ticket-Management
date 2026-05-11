import { apiClient } from "./client"
import type { BoardView, Ticket } from "../pages/ticketing/types"

export const createTicket = (data: unknown) =>
  apiClient("/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  })

/** Pagination metadata (camelCase); normalized from Rails JSON. */
export type TicketsBoardMeta = {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasMore: boolean
}

/** Aggregates for the filtered set (camelCase); normalized from Rails JSON. */
export type TicketsBoardStats = {
  total: number
  todo: number
  done: number
  highPriority: number
}

export type TicketsBoardResponse = {
  tickets: Ticket[]
  meta: TicketsBoardMeta
  stats: TicketsBoardStats
}

/** Client params (camelCase); mapped to Rails query keys in `getTicketsBoard`. */
export type GetTicketsBoardParams = {
  projectId: number
  boardView: BoardView
  sprintId?: number | null
  q?: string
  priorities?: string[]
  statuses?: string[]
  assigneeIds?: number[]
  dateFrom?: string
  dateTo?: string
  page?: number
}

type TicketsBoardMetaRaw = {
  page: number
  per_page: number
  total: number
  total_pages: number
  has_more: boolean
}

type TicketsBoardStatsRaw = {
  total: number
  todo: number
  done: number
  high_priority: number
}

type TicketsBoardResponseRaw = {
  tickets: Ticket[]
  meta: TicketsBoardMetaRaw
  stats: TicketsBoardStatsRaw
}

function appendCsv(sp: URLSearchParams, key: string, values: string[]) {
  if (values.length === 0) return
  sp.set(key, values.join(","))
}

function appendIds(sp: URLSearchParams, key: string, ids: number[]) {
  if (ids.length === 0) return
  sp.set(key, ids.join(","))
}

function normalizeBoardMeta(raw: TicketsBoardMetaRaw): TicketsBoardMeta {
  return {
    page: raw.page,
    perPage: raw.per_page,
    total: raw.total,
    totalPages: raw.total_pages,
    hasMore: raw.has_more,
  }
}

function normalizeBoardStats(raw: TicketsBoardStatsRaw): TicketsBoardStats {
  return {
    total: raw.total,
    todo: raw.todo,
    done: raw.done,
    highPriority: raw.high_priority,
  }
}

/** Paginated, filtered board tickets (20 per page). */
export async function getTicketsBoard(params: GetTicketsBoardParams): Promise<TicketsBoardResponse> {
  const sp = new URLSearchParams()
  sp.set("project_id", String(params.projectId))
  sp.set("board_view", params.boardView)
  if (params.sprintId != null && params.sprintId > 0) {
    sp.set("sprint_id", String(params.sprintId))
  }
  if (params.q?.trim()) sp.set("q", params.q.trim())
  appendCsv(sp, "priorities", params.priorities ?? [])
  appendCsv(sp, "statuses", params.statuses ?? [])
  appendIds(sp, "assignee_ids", params.assigneeIds ?? [])
  if (params.dateFrom) sp.set("date_from", params.dateFrom)
  if (params.dateTo) sp.set("date_to", params.dateTo)
  sp.set("page", String(params.page ?? 1))

  const raw = await apiClient<TicketsBoardResponseRaw>(`/tickets?${sp.toString()}`, {
    method: "GET",
  })

  return {
    tickets: raw.tickets,
    meta: normalizeBoardMeta(raw.meta),
    stats: normalizeBoardStats(raw.stats),
  }
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
  jobId?: string
}

/** Admin-only: queues a Sidekiq job that emails a full project / sprint / ticket export (CSV attached). */
export async function requestTicketExport(): Promise<TicketExportResponse> {
  const raw = await apiClient<{ message: string; job_id?: string }>("/tickets/export", {
    method: "POST",
    body: JSON.stringify({}),
  })
  return { message: raw.message, jobId: raw.job_id }
}