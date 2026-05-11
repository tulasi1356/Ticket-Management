import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateTicket, type UpdateTicketPayload } from "../../api/ticketApi"

export const useUpdateTicket = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTicketPayload }) =>
      updateTicket(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "board"] })
    },
  })
}
