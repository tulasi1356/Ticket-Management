import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { CreateTicket } from "../createTicket"
import { TicketDetailPanel } from "./TicketDetailPanel"
import { TicketListItem } from "./TicketListItem"
import type { BoardView, Project, Sprint, Ticket } from "./types"
import { computeTicketStats, formatTicketKey } from "./utils"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { AssigneeAvatar } from "../../components/ui/avatar"
import { Tooltip } from "../../components/ui/tooltip"

type SprintDashboardPanelProps = {
  selectedProject: Project | undefined
  selectedSprint: Sprint | undefined
  selectedProjectId: number | null
  selectedSprintId: number | null
  sprintsForProject: Sprint[]
  ticketsForView: Ticket[]
  projectDisplayName: string
  boardView: BoardView
  resetFiltersKey: string
}

const PRIORITIES = ["high", "medium", "low"]

export function SprintDashboardPanel({
  selectedProject,
  selectedSprint,
  selectedProjectId,
  selectedSprintId,
  sprintsForProject,
  ticketsForView,
  projectDisplayName,
  boardView,
  resetFiltersKey,
}: SprintDashboardPanelProps) {
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set())
  const [assigneeFilter, setAssigneeFilter] = useState<Set<number>>(new Set())
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)

  useEffect(() => {
    setSearch("")
    setPriorityFilter(new Set())
    setAssigneeFilter(new Set())
    setSelectedTicketId(null)
  }, [resetFiltersKey])

  const selectedTicket = useMemo(() => {
    if (selectedTicketId == null) return undefined
    return ticketsForView.find((t) => t.id === selectedTicketId)
  }, [ticketsForView, selectedTicketId])

  useEffect(() => {
    if (selectedTicketId == null) return
    if (!ticketsForView.some((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(null)
    }
  }, [ticketsForView, selectedTicketId])

  const stats = useMemo(() => computeTicketStats(ticketsForView), [ticketsForView])

  const assigneesInView = useMemo(() => {
    const map = new Map<number, string>()
    for (const t of ticketsForView) {
      if (t.assignee?.id != null) map.set(t.assignee.id, t.assignee.name)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [ticketsForView])

  const filteredTickets = useMemo(() => {
    let list = ticketsForView

    if (priorityFilter.size > 0) {
      list = list.filter((t) => priorityFilter.has(t.priority))
    }

    if (assigneeFilter.size > 0) {
      list = list.filter(
        (t) => t.assignee?.id != null && assigneeFilter.has(t.assignee.id)
      )
    }

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((t) => t.title.toLowerCase().includes(q))
    }

    return list
  }, [ticketsForView, priorityFilter, assigneeFilter, search])

  const highGroup = useMemo(
    () => filteredTickets.filter((t) => t.priority === "high"),
    [filteredTickets]
  )
  const otherGroup = useMemo(
    () => filteredTickets.filter((t) => t.priority !== "high"),
    [filteredTickets]
  )

  const toggleAssignee = (id: number) => {
    setAssigneeFilter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const togglePriority = (priority: string) => {
    setPriorityFilter((prev) => {
      const next = new Set(prev)
      if (next.has(priority)) next.delete(priority)
      else next.add(priority)
      return next
    })
  }

  const breadcrumb =
    selectedProject && selectedSprint
      ? `${selectedProject.name} › ${selectedSprint.name}`
      : selectedProject
        ? selectedProject.name
        : "Tickets"

  const emptyMessage = (() => {
    if (!selectedProjectId) return "Select a project from the sidebar."
    // if (boardView === "sprint" && !selectedSprintId) {
    //   return sprintsForProject.length === 0
    //     ? "No sprints yet. Use + Add sprint to create one."
    //     : "Select a sprint in the sidebar."
    // }
    // if (boardView === "backlog") return "No backlog items."
    // if (boardView === "mine") return "No tickets assigned to you in this project."
    // if (boardView === "all") return "No tickets in this project yet."
    // if (boardView === "sprint") return "No tickets in this sprint. Use + Create Ticket to add one."
    return "No tickets match this view."
  })()

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50/80">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <p className="text-xs text-gray-500">Board</p>
          <h1 className="text-lg font-semibold text-gray-900">{breadcrumb}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedProject && selectedSprint && (
            <CreateTicket
              projectId={selectedProject.id}
              projectName={selectedProject.name}
              sprintId={selectedSprint.id}
              sprintName={selectedSprint.name}
              triggerVariant="primary"
              triggerLabel="+ Create Ticket"
            />
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {!selectedProjectId ||
        (boardView === "sprint" && !selectedSprintId) ||
        ticketsForView.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        ) : selectedTicket ? (
          <TicketDetailPanel
            ticket={selectedTicket}
            ticketKey={formatTicketKey(projectDisplayName, selectedTicket.id)}
            projectName={selectedProject?.name}
            sprintName={selectedSprint?.name}
            onBack={() => setSelectedTicketId(null)}
          />
        ) : (
          <>
            <div className="flex flex-row justify-between gap-4 mb-6">
              <Card className="w-1/3">
                <CardHeader className="text-gray-500 text-xs font-medium uppercase tracking-wide">TOTAL</CardHeader>
                <CardContent >
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <p className="text-sm text-gray-600">tickets</p>
                </CardContent>
              </Card>
              <Card className="w-1/3">
                <CardHeader className="text-gray-500 text-xs font-medium uppercase tracking-wide">TODO</CardHeader>
                <CardContent >
                  <div className="text-2xl font-bold text-gray-500">{stats.todo}</div>
                  <p className="text-sm text-gray-600">not started</p>
                </CardContent>
              </Card>
              <Card className="w-1/3">
                <CardHeader className="text-gray-500 text-xs font-medium uppercase tracking-wide">DONE</CardHeader>
                <CardContent >
                  <div className="text-2xl font-bold text-green-600">{stats.done}</div>
                  <p className="text-sm text-gray-600">completed</p>
                </CardContent>
              </Card>
              <Card className="w-1/3">
                <CardHeader className="text-gray-500 text-xs font-medium uppercase tracking-wide">HIGH PRIORITY</CardHeader>
                <CardContent >
                  <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
                  <p className="text-sm text-gray-600">need attention</p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Priority</span>
                {PRIORITIES.map((p) => {
                  return <button id = "priority-button" aria-label={`Priority ${p}`} key={p} onClick={() => togglePriority(p)}>
                    <Badge size="xs" variant={p === "high" ? "danger" : p === "medium" ? "warning" : "default"}>{p.charAt(0).toUpperCase() + p.slice(1)}</Badge>
                  </button>
                })}
              </div>

              {assigneesInView.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">Assignee</span>
                  <div className="flex items-center -space-x-2">
                    {assigneesInView.map(([id, name]) => (
                      <Tooltip key={id} content={name}>
                        <button
                          id = "assignee-button"
                          aria-label={`Assignee ${name}`}
                          type="button"
                          onClick={() => toggleAssignee(id)}
                          className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        >
                          <AssigneeAvatar
                            name={name}
                            size="sm"
                            className="ring-2 ring-white hover:z-10"
                          />
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative min-w-[200px] flex-1 lg:max-w-xs lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none ring-blue-500/20 focus:border-blue-400 focus:bg-white focus:ring-2"
                />
              </div>
            </div>

            <div className="flex flex-col gap-8">
              {highGroup.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold text-gray-800">
                    High priority{" "}
                    <span className="font-normal text-gray-500">({highGroup.length})</span>
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {highGroup.map((ticket) => (
                      <li key={ticket.id}>
                        <TicketListItem
                          ticket={ticket}
                          ticketKey={formatTicketKey(projectDisplayName, ticket.id)}
                          selected={selectedTicketId === ticket.id}
                          onSelect={() => setSelectedTicketId(ticket.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {otherGroup.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold text-gray-800">
                    Other{" "}
                    <span className="font-normal text-gray-500">({otherGroup.length})</span>
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {otherGroup.map((ticket) => (
                      <li key={ticket.id}>
                        <TicketListItem
                          ticket={ticket}
                          ticketKey={formatTicketKey(projectDisplayName, ticket.id)}
                          selected={selectedTicketId === ticket.id}
                          onSelect={() => setSelectedTicketId(ticket.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {filteredTickets.length === 0 && ticketsForView.length > 0 && (
                <p className="py-8 text-center text-sm text-gray-500">
                  No tickets match your filters.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
