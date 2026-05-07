import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProject } from "../../api/projectApi"

export const useCreateProject  = () => {

    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] })
        }
    })
    
}