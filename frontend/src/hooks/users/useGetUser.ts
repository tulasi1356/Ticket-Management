import { useQuery } from "@tanstack/react-query";
import { findUserByEmail } from "../../api/userApi";

export const useGetUser = (email: string) => {
  return useQuery({
    queryKey: ["user", email],
    queryFn: () => findUserByEmail(email),
  });
};