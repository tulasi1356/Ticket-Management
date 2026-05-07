import { useQuery } from "@tanstack/react-query";
import { getProject } from "../../api/projectApi";

export function useGetProject (id: number) {
    return useQuery({
        queryKey: ["project", id],
        queryFn: () => getProject(id),
        enabled: !!id,
    })
}   