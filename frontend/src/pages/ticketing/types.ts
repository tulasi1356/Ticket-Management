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
  assignee?: TicketAssignee
  status: string
  priority: string
  issue_type: string
}

export type BoardView = "sprint" | "all" | "mine" | "backlog"
