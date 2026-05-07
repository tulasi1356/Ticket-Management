import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../../api/userApi";

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};