import { useMutation, useQueryClient } from "@tanstack/react-query"
import { assignUsersToProject } from "../../api/projectApi"

export const useAssignUsersToProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignUsersToProject,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] })
    },
  })
}

