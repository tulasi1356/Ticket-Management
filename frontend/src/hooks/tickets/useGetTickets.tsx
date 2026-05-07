import { useQuery } from "@tanstack/react-query"
import { getTickets } from "../../api/ticketApi"

export const useGetTickets = (enabled = true) => {
    return useQuery({
        queryKey: ["tickets"],
        queryFn: () => getTickets(),
        enabled,
    })
}