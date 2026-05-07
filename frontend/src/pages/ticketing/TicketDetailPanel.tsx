import type { ReactNode } from "react"
import { ChevronLeft } from "lucide-react"

import { AssigneeAvatar } from "../../components/ui/avatar"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../lib/utils"
import type { Ticket } from "./types"

function priorityBadge(priority: string) {
  if (priority === "low") return <Badge size="sm" variant="default">Low</Badge>
  if (priority === "medium") return <Badge size="sm" variant="warning">Medium</Badge>
  return <Badge size="sm" variant="danger">High</Badge>
}

function statusBadge(status: string) {
  if (status === "todo") return <Badge size="sm" variant="default">Todo</Badge>
  if (status === "in_progress") return <Badge size="sm" variant="warning">In Progress</Badge>
  if (status === "test") return <Badge size="sm" variant="info">Test</Badge>
  if (status === "done") return <Badge size="sm" variant="success">Done</Badge>
  return null
}

function issueTypeLabel(issueType: string) {
  if (issueType === "bug") return "Bug"
  if (issueType === "feature") return "Feature"
  if (issueType === "task") return "Task"
  return issueType
}

function SidebarRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  )
}

type TicketDetailPanelProps = {
  ticket: Ticket
  ticketKey: string
  projectName?: string
  sprintName?: string
  onBack: () => void
}

export function TicketDetailPanel({
  ticket,
  ticketKey,
  projectName,
  sprintName,
  onBack,
}: TicketDetailPanelProps) {
  const breadcrumb = [projectName, sprintName].filter(Boolean).join(" › ")
  const description =
    ticket.description?.trim() ||
    "No description provided."

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="min-h-0 flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Back to board
          </button>
          {breadcrumb ? (
            <p className="mb-1 text-xs text-gray-500">{breadcrumb}</p>
          ) : null}
          <p className="font-mono text-xs font-semibold text-gray-500">{ticketKey}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">{ticket.title}</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <section className="mb-8">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">Description</h3>
            <div
              className={cn(
                "rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm leading-relaxed text-gray-800",
                !ticket.description?.trim() && "text-gray-500"
              )}
            >
              {description}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Comments</h3>
            <div className="mb-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-10 text-center text-sm text-gray-500">
              No comments yet.
            </div>
            <label htmlFor="ticket-comment-placeholder" className="sr-only">
              Add comment
            </label>
            <textarea
              id="ticket-comment-placeholder"
              readOnly
              rows={3}
              placeholder="Comments will be available when messaging is connected."
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 outline-none"
            />
          </section>
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-72 xl:w-80">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Details
          </h3>
          <div className="divide-y divide-gray-100">
            <SidebarRow label="Priority">{priorityBadge(ticket.priority)}</SidebarRow>
            <SidebarRow label="Status">{statusBadge(ticket.status)}</SidebarRow>
            <SidebarRow label="Assignee">
              <div className="flex items-center gap-2">
                <AssigneeAvatar
                  name={ticket.assignee?.name ?? "Unassigned"}
                  title={ticket.assignee?.name ?? "Unassigned"}
                  className="size-8 text-xs"
                />
                <span>{ticket.assignee?.name ?? "Unassigned"}</span>
              </div>
            </SidebarRow>
            <SidebarRow label="Issue type">{issueTypeLabel(ticket.issue_type)}</SidebarRow>
            {sprintName ? <SidebarRow label="Sprint">{sprintName}</SidebarRow> : null}
            {projectName ? <SidebarRow label="Project">{projectName}</SidebarRow> : null}
          </div>
        </div>
      </aside>
    </div>
  )
}
