import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createComment, type CreateCommentBody } from "../../api/commentsApi"

export const useCreateComment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCommentBody) => createComment(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.ticket_id] })
    },
  })
}
