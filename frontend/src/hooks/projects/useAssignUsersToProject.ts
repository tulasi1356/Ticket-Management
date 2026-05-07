import { useMutation, useQueryClient } from "@tanstack/react-query"
import { assignUsersToProject } from "../../api/projectApi"

export const useAssignUsersToProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignUsersToProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

