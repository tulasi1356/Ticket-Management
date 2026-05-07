import { useMutation } from "@tanstack/react-query"
import { createSprint } from "../../api/sprintApi"

export const useCreateSprint = () => {
    return useMutation({
        mutationFn: createSprint,
    })
}