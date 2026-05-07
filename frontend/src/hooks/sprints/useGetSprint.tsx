import { useQuery } from "@tanstack/react-query"
import { getSprints } from "../../api/sprintApi"

export const useGetSprint = (enabled = true) => {
    return useQuery({
        queryKey: ["sprints"],
        queryFn: getSprints,
        enabled,
    })
}