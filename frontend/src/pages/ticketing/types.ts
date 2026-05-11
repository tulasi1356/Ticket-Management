/**
 * Ticketing domain types mirror Rails JSON keys (`snake_case`) for direct `fetch` / `as_json` use.
 * Board list API wrappers normalize pagination `meta` / `stats` to camelCase in `ticketApi.ts`.
 */
export type ProjectUser = { id: number; name: string; email?: string; role?: string }

export type Project = {
  id: number
  name: string
  description: string
  users?: ProjectUser[]
}

export type Sprint = {
  id: number
  name: string
  project_id: number
  status?: string
}

export type TicketAssignee = { id: number; name: string; email?: string }

export type Ticket = {
  id: number
  title: string
  sprint_id: number
  project_id?: number
  description?: string | null
  assignee?: TicketAssignee
  status: string
  priority: string
  issue_type: string
  start_date?: string | null
  end_date?: string | null
  attachment_urls?: string[] | null
}

export type TicketCommentUser = { id: number; name: string; email?: string }

export type TicketComment = {
  id: number
  ticket_id: number
  user_id: number
  message?: string | null
  attachment_urls?: string[] | null
  created_at: string
  user?: TicketCommentUser | null
}

export type BoardView = "sprint" | "all" | "mine" | "backlog"
