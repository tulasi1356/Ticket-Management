import { Bug, FileText, ListTodo } from "lucide-react"

import { Badge } from "../../components/ui/badge"
import { AssigneeAvatar } from "../../components/ui/avatar"
import { Tooltip } from "../../components/ui/tooltip"
import { cn } from "../../lib/utils"
import type { Ticket } from "./types"

function IssueIcon({ issueType }: { issueType: string }) {
  if (issueType === "bug") {
    return <Bug className="size-4 text-red-500" aria-hidden />
  }
  if (issueType === "feature") {
    return <FileText className="size-4 text-blue-500" aria-hidden />
  }
  return <ListTodo className="size-4 text-slate-500" aria-hidden />
}

function priorityBadge(priority: string) {
  const p = priority.toLowerCase()
  if (p === "low") {
    return (
      <Badge size="sm" variant="default">
        Low
      </Badge>
    )
  }
  if (p === "medium") {
    return (
      <Badge size="sm" variant="warning">
        Medium
      </Badge>
    )
  }
  if (!p.trim()) {
    return null
  }
  return (
    <Badge size="sm" variant="danger">
      High
    </Badge>
  )
}

function statusBadge(status: string) {
  const s = status.toLowerCase()
  if (s === "todo") {
    return (
      <Badge size="sm" variant="default">
        Todo
      </Badge>
    )
  }
  if (s === "in_progress") {
    return (
      <Badge size="sm" variant="warning">
        In Progress
      </Badge>
    )
  }
  if (s === "test") {
    return (
      <Badge size="sm" variant="info">
        Test
      </Badge>
    )
  }
  if (s === "done") {
    return (
      <Badge size="sm" variant="success">
        Done
      </Badge>
    )
  }
  return null
}

export function TicketListItem({
  ticket,
  ticketKey,
  onSelect,
  selected,
}: {
  ticket: Ticket
  ticketKey: string
  onSelect?: () => void
  selected?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full min-w-0 cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_5.75rem_9.5rem_auto] items-center gap-x-3 rounded-lg border bg-white px-3 py-2.5 text-left shadow-sm",
        "transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
        selected ? "border-blue-400 ring-1 ring-blue-100" : "border-gray-200"
      )}
    >
      {/* <input
        type="checkbox"
        className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        aria-label={`Select ${ticketKey}`}
        onChange={() => {
        }}
      /> */}

      <IssueIcon issueType={ticket.issue_type} />

      <span className="shrink-0 font-mono text-xs font-semibold text-gray-500">{ticketKey}</span>

      <span className="min-w-0 truncate font-medium text-gray-900">{ticket.title}</span>

      <div className="flex min-h-[1.75rem] items-center justify-start">{priorityBadge(ticket.priority)}</div>

      <div className="flex min-h-[1.75rem] items-center justify-start">{statusBadge(ticket.status)}</div>

      <div className="flex min-w-0 justify-self-end">
        {ticket.assignee ? (
          <Tooltip
            content={ticket.assignee.email?.trim() ? ticket.assignee.email : "No email on file"}
            side="top"
          >
            <span className="flex max-w-[min(200px,28vw)] items-center gap-2 rounded-md px-1 py-0.5 text-left">
              <AssigneeAvatar name={ticket.assignee.name} size="sm" className="ring-2 ring-white" />
              <span className="truncate text-sm font-medium text-gray-900">{ticket.assignee.name}</span>
            </span>
          </Tooltip>
        ) : (
          <span className="flex items-center gap-2 text-sm text-gray-500">
            <AssigneeAvatar name="Unassigned" size="sm" />
            Unassigned
          </span>
        )}
      </div>
    </button>
  )
}
