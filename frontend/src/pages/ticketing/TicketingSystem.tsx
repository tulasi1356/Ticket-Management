import { useEffect, useMemo, useState } from "react"
import { useRouterState } from "@tanstack/react-router"

import { useProjects } from "../../hooks/projects/useProjects"
import { useGetSprint } from "../../hooks/sprints/useGetSprint"
import { useAuthStore } from "../../stores/authStore"

import { SprintDashboardPanel } from "./SprintDashboardPanel"
import { TicketingSidebar } from "./TicketingSidebar"
import type { BoardView, Project, Sprint } from "./types"

export function TicketingSystem() {
  const user = useAuthStore((s) => s.user)
  const enabled = !!user
  const { data, error, isLoading } = useProjects(enabled)
  const { data: sprints, error: errorSprints, isLoading: isLoadingSprints } = useGetSprint(enabled)

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

  const resetFiltersKey = `${boardView}-${selectedProjectId ?? ""}-${selectedSprintId ?? ""}`

  if (!user) {
    return (
      <div className="p-6 text-muted-foreground">
        You must be logged in to view ticketing.
      </div>
    )
  }

  if (isLoading || isLoadingSprints) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-gray-500">
        Loading...
      </div>
    )
  }

  if (error || errorSprints) {
    console.error("Error fetching projects:", error)
    console.error("Error fetching sprints:", errorSprints)
    return (
      <div className="p-6 text-red-600">Could not load ticketing data.</div>
    )
  }

  if (!data?.length) {
    return (
      <div className="p-6 text-muted-foreground">
        No projects yet
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
        projectDisplayName={selectedProject?.name ?? ""}
        boardView={boardView}
        resetFiltersKey={resetFiltersKey}
        isAdmin={user.role === "admin"}
      />
    </div>
  )
}
