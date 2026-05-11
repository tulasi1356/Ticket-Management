import { useQuery } from "@tanstack/react-query"

import { fetchTicketComments } from "../../api/commentsApi"

export function useGetComments(ticketId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["comments", ticketId],
    queryFn: () => fetchTicketComments(ticketId!),
    enabled: ticketId != null && enabled,
  })
}
