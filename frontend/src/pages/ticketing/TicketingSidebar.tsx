import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight } from "lucide-react"

import { cn } from "../../lib/utils"
import AddSprint from "./CreateSprint"
import type { BoardView, Project, Sprint } from "./types"
import { sprintStatusUi } from "./utils"
import { useAuthStore } from "../../stores/authStore"

type TicketingSidebarProps = {
  projects: Project[]
  sprints: Sprint[]
  selectedProjectId: number | null
  selectedSprintId: number | null
  onSelectProject: (id: number) => void
  onSelectSprint: (id: number) => void
  onSprintCreated: (id: number) => void
  boardView: BoardView
  onBoardViewChange: (view: BoardView) => void
}

function activeSprintCount(projectId: number, projectSprints: Sprint[]): number {
  return projectSprints.filter((s) => s.project_id === projectId && s.status === "active").length
}

export function TicketingSidebar({
  projects,
  sprints,
  selectedProjectId,
  selectedSprintId,
  onSelectProject,
  onSelectSprint,
  onSprintCreated,
  boardView,
  onBoardViewChange,
}: TicketingSidebarProps) {

  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === "admin" || false
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    if (selectedProjectId != null) {
      setExpandedIds((prev) => new Set(prev).add(selectedProjectId))
    }
  }, [selectedProjectId])

  const sprintsByProject = useMemo(() => {
    const map = new Map<number, Sprint[]>()
    for (const s of sprints) {
      const list = map.get(s.project_id) ?? []
      list.push(s)
      map.set(s.project_id, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return map
  }, [sprints])

  const toggleProject = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }


  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Projects
        </p>
        <nav className="flex flex-col gap-0.5">
          {projects.map((project) => {
            const projectSprints = sprintsByProject.get(project.id) ?? []
            const expanded = expandedIds.has(project.id)
            const activeCount = activeSprintCount(project.id, sprints)

            return (
              <div key={project.id}>
                <button
                  id = "project-button"
                  aria-label={`Project ${project.name}`}
                  type="button"
                  onClick={() => {
                    toggleProject(project.id)
                    onSelectProject(project.id)
                  }}
                  className={cn(
                    "flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-100",
                    selectedProjectId === project.id && "bg-gray-50"
                  )}
                >
                  {expanded ? (
                    <ChevronDown className="size-4 shrink-0 text-gray-500" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-gray-500" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  {!expanded && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {activeCount || projectSprints.length}
                    </span>
                  )}
                </button>

                {expanded && (
                  <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-gray-100 pl-2">
                    {projectSprints.map((sp) => {
                      const { label, dotClass } = sprintStatusUi(sp.status)
                      const selected =
                        selectedSprintId === sp.id &&
                        selectedProjectId === project.id &&
                        boardView === "sprint"

                      return (
                        <button
                          id = "sprint-button"
                          aria-label={`Sprint ${sp.name}`}
                          key={sp.id}
                          type="button"
                          onClick={() => {
                            onSelectProject(project.id)
                            onSelectSprint(sp.id)
                            onBoardViewChange("sprint")
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                            selected
                              ? "bg-blue-50 font-medium text-blue-900"
                              : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          <span className={cn("size-2 shrink-0 rounded-full", dotClass)} />
                          <span className="min-w-0 flex-1 truncate">{sp.name}</span>
                          <span
                            className={cn(
                              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                              sp.status === "active" && "bg-emerald-50 text-emerald-700",
                              sp.status === "planned" && "bg-amber-50 text-amber-800",
                              sp.status === "completed" && "bg-gray-100 text-gray-600"
                            )}
                          >
                            {label}
                          </span>
                        </button>
                      )
                    })}

                    <div className="pt-1">
                      <AddSprint
                        projectId={project.id}
                        projectName={project.name}
                        onSprintCreated={(id) => {
                          onSprintCreated(id)
                          onSelectProject(project.id)
                        }}
                        triggerVariant="sidebar"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Views
        </p> */}
        {/* <nav className="flex flex-col gap-0.5">
          {viewLinks.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onBoardViewChange(id)}
              className={cn(
                "rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100",
                boardView === id && "bg-gray-100 font-medium text-gray-900"
              )}
            >
              {label}
            </button>
          ))}
        </nav> */}
      </div>

      <div className="border-t border-gray-200 p-3">
        {isAdmin ? (
        <Link
          to="/all_projects"
          className="flex w-full items-center justify-center rounded-md border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add Project
        </Link>
        ) : null}
      </div>
    </aside>
  )
}
