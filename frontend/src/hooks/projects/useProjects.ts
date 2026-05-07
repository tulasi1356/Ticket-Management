import { useQuery } from "@tanstack/react-query"
import { getProjects } from "../../api/projectApi"

export const useProjects = (enabled = true) => {
    return useQuery({
        queryKey: ["projects"],
        queryFn: getProjects,
        enabled,
    })
}