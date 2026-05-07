import { useEffect, useMemo, useState } from "react"
import { useRouterState } from "@tanstack/react-router"

import { useProjects } from "../../hooks/projects/useProjects"
import { useGetSprint } from "../../hooks/sprints/useGetSprint"
import { useGetTickets } from "../../hooks/tickets/useGetTickets"
import { useAuthStore } from "../../stores/authStore"

import { SprintDashboardPanel } from "./SprintDashboardPanel"
import { TicketingSidebar } from "./TicketingSidebar"
import type { BoardView, Project, Sprint, Ticket } from "./types"

export function TicketingSystem() {
  const user = useAuthStore((s) => s.user)
  const enabled = !!user
  const { data, error, isLoading } = useProjects(enabled)
  const { data: sprints, error: errorSprints, isLoading: isLoadingSprints } = useGetSprint(enabled)
  const { data: tickets, error: errorTickets, isLoading: isLoadingTickets } = useGetTickets(enabled)

  const searchProjectId = useRouterState({
    select: (s) => {
      const raw = (s.location.search as Record<string, unknown> | undefined)?.projectId
      const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN
      return Number.isFinite(n) ? n : null
    },
  })

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null)
  const [boardView, setBoardView] = useState<BoardView>("sprint")

  useEffect(() => {
    if (!data?.length) return

    // If we were navigated here from Projects "View", honor that selection.
    if (
      searchProjectId != null &&
      data.some((p: Project) => p.id === searchProjectId) &&
      selectedProjectId !== searchProjectId
    ) {
      setSelectedProjectId(searchProjectId)
      return
    }

    // Otherwise default to first project once.
    if (selectedProjectId === null) setSelectedProjectId(data[0].id)
  }, [data, selectedProjectId, searchProjectId])

  const sprintsForProject = useMemo(() => {
    if (selectedProjectId == null) return []
    return (sprints ?? []).filter((s: Sprint) => s.project_id === selectedProjectId)
  }, [sprints, selectedProjectId])

  useEffect(() => {
    if (!selectedProjectId) return
    if (!sprintsForProject.length) {
      setSelectedSprintId(null)
      return
    }
    setSelectedSprintId((prev) => {
      if (prev != null && sprintsForProject.some((s: Sprint) => s.id === prev)) return prev
      return sprintsForProject[0].id
    })
  }, [selectedProjectId, sprintsForProject])

  const selectedProject = data?.find((p: Project) => p.id === selectedProjectId)
  const selectedSprint = sprintsForProject.find((s: Sprint) => s.id === selectedSprintId)

  const sprintProjectMap = useMemo(() => {
    const m = new Map<number, number>()
    for (const s of sprints ?? []) {
      m.set(s.id, s.project_id)
    }
    return m
  }, [sprints])

  const ticketsForView = useMemo(() => {
    if (!tickets?.length || selectedProjectId == null) return []

    const projectId = selectedProjectId
    const resolveProject = (t: Ticket) =>
      t.project_id ?? sprintProjectMap.get(t.sprint_id)

    if (boardView === "sprint") {
      if (selectedSprintId == null) return []
      return tickets.filter((t: Ticket) => t.sprint_id === selectedSprintId)
    }

    if (boardView === "all") {
      return tickets.filter((t: Ticket) => resolveProject(t) === projectId)
    }

    if (boardView === "mine") {
      const uid = user?.id
      if (uid == null) return []
      return tickets.filter(
        (t: Ticket) =>
          resolveProject(t) === projectId && t.assignee?.id === uid
      )
    }

    /* backlog — requires nullable sprint in API */
    return tickets.filter(
      (t: Ticket) =>
        resolveProject(t) === projectId &&
        (t as Ticket & { sprint_id?: number }).sprint_id == null
    )
  }, [
    tickets,
    selectedProjectId,
    selectedSprintId,
    boardView,
    user?.id,
    sprintProjectMap,
  ])

  const resetFiltersKey = `${boardView}-${selectedProjectId ?? ""}-${selectedSprintId ?? ""}`

  if (!user) {
    return (
      <div className="p-6 text-muted-foreground">
        You must be logged in to view ticketing.
      </div>
    )
  }

  if (isLoading || isLoadingSprints || isLoadingTickets) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-gray-500">
        Loading...
      </div>
    )
  }

  if (error || errorSprints || errorTickets) {
    console.error("Error fetching projects:", error)
    console.error("Error fetching sprints:", errorSprints)
    console.error("Error fetching tickets:", errorTickets)
    return (
      <div className="p-6 text-red-600">Could not load ticketing data.</div>
    )
  }

  if (!data?.length) {
    return (
      <div className="p-6 text-muted-foreground">
        No projects yet. Add a project from the Projects page.
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-57px)] w-full max-w-full bg-gray-50">
      <TicketingSidebar
        projects={data}
        sprints={sprints ?? []}
        selectedProjectId={selectedProjectId}
        selectedSprintId={selectedSprintId}
        onSelectProject={setSelectedProjectId}
        onSelectSprint={setSelectedSprintId}
        onSprintCreated={setSelectedSprintId}
        boardView={boardView}
        onBoardViewChange={setBoardView}
      />

      <SprintDashboardPanel
        selectedProject={selectedProject}
        selectedSprint={selectedSprint}
        selectedProjectId={selectedProjectId}
        selectedSprintId={selectedSprintId}
        sprintsForProject={sprintsForProject}
        ticketsForView={ticketsForView}
        projectDisplayName={selectedProject?.name ?? ""}
        boardView={boardView}
        resetFiltersKey={resetFiltersKey}
      />
    </div>
  )
}
