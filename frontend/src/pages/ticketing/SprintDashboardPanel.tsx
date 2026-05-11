import { useEffect, useMemo, useState } from "react"
import { Download, Loader2, Search } from "lucide-react"
import { CreateTicket } from "../../components/createTicket"
import { TicketDetailPanel } from "./TicketDetailPanel"
import { TicketListItem } from "./TicketListItem"
import type { BoardView, Project, Sprint } from "./types"
import { formatTicketKey } from "./utils"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { UserMultiSelect } from "../../components/UserMultiSelect"
import { useAdminTicketExport } from "../../hooks/useAdminTicketExport"
import { useTicketsBoardInfinite } from "../../hooks/tickets/useTicketsBoardInfinite"
import { cn } from "../../lib/utils"

type SprintDashboardPanelProps = {
  selectedProject: Project | undefined
  selectedSprint: Sprint | undefined
  selectedProjectId: number | null
  selectedSprintId: number | null
  sprintsForProject: Sprint[]
  projectDisplayName: string
  boardView: BoardView
  resetFiltersKey: string
  isAdmin?: boolean
}

const PRIORITIES = ["high", "medium", "low"] as const

const STATUSES = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "test", label: "Test" },
  { value: "done", label: "Done" },
] as const

const OTHER_LIST_MAX_HEIGHT_CLASS = "max-h-[min(34rem,55vh)]"

export function SprintDashboardPanel({
  selectedProject,
  selectedSprint,
  selectedProjectId,
  selectedSprintId,
  sprintsForProject: _sprintsForProject,
  projectDisplayName,
  boardView,
  resetFiltersKey,
  isAdmin = false,
}: SprintDashboardPanelProps) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set())
  const [assigneeFilter, setAssigneeFilter] = useState<Set<number>>(new Set())
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const { busy: exportBusy, run: runAdminExport } = useAdminTicketExport()

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 350)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setSearch("")
    setDebouncedSearch("")
    setPriorityFilter(new Set())
    setStatusFilter(new Set())
    setAssigneeFilter(new Set())
    setDateFrom("")
    setDateTo("")
    setSelectedTicketId(null)
  }, [resetFiltersKey])

  const ticketsQuery = useTicketsBoardInfinite({
    enabled: true,
    projectId: selectedProjectId,
    sprintId: selectedSprintId,
    boardView,
    debouncedSearch,
    priorityFilter,
    statusFilter,
    assigneeFilter,
    dateFrom,
    dateTo,
  })

  const allTickets = useMemo(
    () => ticketsQuery.data?.pages.flatMap((p) => p.tickets) ?? [],
    [ticketsQuery.data]
  )

  const firstPage = ticketsQuery.data?.pages[0]
  const totalCount = firstPage?.meta.total ?? 0
  const statsFromApi = firstPage?.stats ?? {
    total: 0,
    todo: 0,
    done: 0,
    highPriority: 0,
  }

  const selectedTicket = useMemo(() => {
    if (selectedTicketId == null) return undefined
    return allTickets.find((t) => t.id === selectedTicketId)
  }, [allTickets, selectedTicketId])

  useEffect(() => {
    if (selectedTicketId == null) return
    if (ticketsQuery.isPending) return
    const flat = ticketsQuery.data?.pages.flatMap((p) => p.tickets) ?? []
    if (!flat.some((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(null)
    }
  }, [selectedTicketId, ticketsQuery.isPending, ticketsQuery.data])

  const projectUsersForFilter = useMemo(() => {
    const users = selectedProject?.users
    if (!users?.length) return []
    return users
      .map((u) => ({ id: u.id, name: u.name, email: u.email }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [selectedProject?.users])

  const highGroup = useMemo(
    () => allTickets.filter((t) => t.priority === "high"),
    [allTickets]
  )
  const otherGroup = useMemo(
    () => allTickets.filter((t) => t.priority !== "high"),
    [allTickets]
  )

  const otherTotalLabel = Math.max(0, statsFromApi.total - statsFromApi.highPriority)

  const togglePriority = (priority: string) => {
    setPriorityFilter((prev) => {
      const next = new Set(prev)
      if (next.has(priority)) next.delete(priority)
      else next.add(priority)
      return next
    })
  }

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const clearSidebarFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setPriorityFilter(new Set())
    setStatusFilter(new Set())
    setAssigneeFilter(new Set())
    setDateFrom("")
    setDateTo("")
  }

  const activeFilterCount =
    priorityFilter.size +
    statusFilter.size +
    assigneeFilter.size +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (search.trim() ? 1 : 0)

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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gray-50/80">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <p className="text-xs text-gray-500">Board</p>
          <h1 className="text-lg font-semibold text-gray-900">{breadcrumb}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && selectedProjectId ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={exportBusy}
              onClick={() => void runAdminExport()}
            >
              {exportBusy ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
                  Export…
                </>
              ) : (
                <>
                  <Download className="mr-1 size-4" aria-hidden />
                  Export
                </>
              )}
            </Button>
          ) : null}
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
        {!selectedProjectId || (boardView === "sprint" && !selectedSprintId) ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        ) : selectedTicket ? (
          <TicketDetailPanel
            ticket={selectedTicket}
            ticketKey={formatTicketKey(projectDisplayName, selectedTicket.id)}
            projectName={selectedProject?.name}
            sprintName={selectedSprint?.name}
            projectUsers={selectedProject?.users}
            onBack={() => setSelectedTicketId(null)}
            isAdmin={isAdmin}
          />
        ) : ticketsQuery.isPending ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-8 text-gray-500">
            <Loader2 className="size-8 animate-spin" aria-hidden />
          </div>
        ) : ticketsQuery.isError ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-red-100 bg-white p-8 text-center text-sm text-red-600">
            Could not load tickets.
          </div>
        ) : totalCount === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            {activeFilterCount > 0 ? "No tickets match your filters." : emptyMessage}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-[280px] lg:self-start">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="space-y-1 border-b border-gray-100 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">Filters</CardTitle>
                        <CardDescription className="text-xs">
                          Narrow the ticket list
                        </CardDescription>
                      </div>
                      {activeFilterCount > 0 ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="shrink-0 text-xs"
                          onClick={clearSidebarFilters}
                        >
                          Clear ({activeFilterCount})
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-y-contain pt-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Search
                      </p>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="search"
                          size="sm"
                          placeholder="Search tickets..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-9"
                          aria-label="Search tickets"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Dates
                      </p>
                      <p className="text-[11px] leading-snug text-gray-400">
                        Tickets whose start/end range overlaps this window (needs dates on the ticket).
                      </p>
                      <div className="grid gap-2">
                        <label className="grid gap-1">
                          <span className="text-xs text-gray-600">From</span>
                          <Input
                            type="date"
                            size="sm"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-xs text-gray-600">To</span>
                          <Input
                            type="date"
                            size="sm"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {STATUSES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            aria-label={`Filter status ${s.label}`}
                            aria-pressed={statusFilter.has(s.value)}
                            onClick={() => toggleStatus(s.value)}
                            className={cn(
                              "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                              statusFilter.has(s.value) && "ring-2 ring-blue-500 ring-offset-1"
                            )}
                          >
                            <Badge size="xs" variant="secondary">
                              {s.label}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Priority
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PRIORITIES.map((p) => (
                          <button
                            key={p}
                            type="button"
                            aria-label={`Priority ${p}`}
                            aria-pressed={priorityFilter.has(p)}
                            onClick={() => togglePriority(p)}
                            className={cn(
                              "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                              priorityFilter.has(p) && "ring-2 ring-blue-500 ring-offset-1"
                            )}
                          >
                            <Badge
                              size="xs"
                              variant={
                                p === "high" ? "danger" : p === "medium" ? "warning" : "default"
                              }
                            >
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Users
                      </p>
                      <UserMultiSelect
                        value={[...assigneeFilter]}
                        onChange={(ids) => setAssigneeFilter(new Set(ids))}
                        resolveUsers={projectUsersForFilter}
                        projectId={selectedProjectId}
                        placeholder="Search users..."
                        emptySearchHint="Type to search project members"
                      />
                    </div>
                  </CardContent>
                </Card>
              </aside>

              <div className="min-h-0 min-w-0 flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Total
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-gray-900">{statsFromApi.total}</div>
                      <p className="text-sm text-gray-600">tickets</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Todo
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-gray-500">{statsFromApi.todo}</div>
                      <p className="text-sm text-gray-600">not started</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Done
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-green-600">{statsFromApi.done}</div>
                      <p className="text-sm text-gray-600">completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      High priority
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-red-600">{statsFromApi.highPriority}</div>
                      <p className="text-sm text-gray-600">need attention</p>
                    </CardContent>
                  </Card>
                </div>

            <div className="flex flex-col gap-8">
              {highGroup.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold text-gray-800">
                    High priority{" "}
                    <span className="font-normal text-gray-500">
                      ({statsFromApi.highPriority})
                    </span>
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
                <section aria-labelledby="other-tickets-heading">
                  <h2
                    id="other-tickets-heading"
                    className="mb-3 text-sm font-semibold text-gray-800"
                  >
                    Other{" "}
                    <span className="font-normal text-gray-500">({otherTotalLabel})</span>
                  </h2>
                  <div
                    className={cn(
                      OTHER_LIST_MAX_HEIGHT_CLASS,
                      "overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-xl border border-gray-200 bg-white p-2 shadow-sm scroll-smooth"
                    )}
                  >
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
                  </div>
                </section>
              )}

              {ticketsQuery.hasNextPage ? (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={ticketsQuery.isFetchingNextPage}
                    onClick={() => void ticketsQuery.fetchNextPage()}
                  >
                    {ticketsQuery.isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                        Loading…
                      </>
                    ) : (
                      `Load more (${allTickets.length} of ${totalCount})`
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
