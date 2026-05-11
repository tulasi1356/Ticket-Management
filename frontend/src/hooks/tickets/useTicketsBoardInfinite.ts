import { useInfiniteQuery } from "@tanstack/react-query"

import { getTicketsBoard } from "../../api/ticketApi"
import type { BoardView } from "../../pages/ticketing/types"

export function useTicketsBoardInfinite(opts: {
  enabled: boolean
  projectId: number | null
  sprintId: number | null
  boardView: BoardView
  debouncedSearch: string
  priorityFilter: Set<string>
  statusFilter: Set<string>
  assigneeFilter: Set<number>
  dateFrom: string
  dateTo: string
}) {
  const {
    enabled,
    projectId,
    sprintId,
    boardView,
    debouncedSearch,
    priorityFilter,
    statusFilter,
    assigneeFilter,
    dateFrom,
    dateTo,
  } = opts

  const projectOk = projectId != null && projectId > 0
  const sprintOk = boardView !== "sprint" || (sprintId != null && sprintId > 0)
  const canFetch = enabled && projectOk && sprintOk

  return useInfiniteQuery({
    queryKey: [
      "tickets",
      "board",
      projectId,
      sprintId,
      boardView,
      debouncedSearch,
      [...priorityFilter].sort().join(","),
      [...statusFilter].sort().join(","),
      [...assigneeFilter].sort((a, b) => a - b).join(","),
      dateFrom,
      dateTo,
    ],
    queryFn: ({ pageParam }) =>
      getTicketsBoard({
        projectId: projectId!,
        boardView,
        sprintId: boardView === "sprint" ? sprintId : undefined,
        q: debouncedSearch.trim() || undefined,
        priorities: priorityFilter.size > 0 ? [...priorityFilter] : undefined,
        statuses: statusFilter.size > 0 ? [...statusFilter] : undefined,
        assigneeIds: assigneeFilter.size > 0 ? [...assigneeFilter] : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: pageParam as number,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.page + 1 : undefined),
    enabled: canFetch,
  })
}
