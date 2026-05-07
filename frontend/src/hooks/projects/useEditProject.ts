import { useMutation, useQueryClient } from "@tanstack/react-query"
import { editProject } from "../../api/projectApi"

export const useEditProject = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: editProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] })
        }
    })
}