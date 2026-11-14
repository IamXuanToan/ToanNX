"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authKeys } from "@/shares/constants/query-keys";
import { useAuthStore } from "@/store/auth-store";

import { authService } from "../services/auth.service";
import type { LoginCredentials } from "../types/auth.types";

/**
 * Mutation đăng nhập; thành công thì ghi người dùng vào cache `authKeys.me()`.
 *
 * @returns Mutation React Query.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const resetSession = useAuthStore((state) => state.resetSession);
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (current) => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.me(), current);
      resetSession();
    },
  });
}
