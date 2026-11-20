"use client";

import { useQuery } from "@tanstack/react-query";

import { authKeys } from "../constants/query-keys";
import { adminAuthSessionService } from "../services/admin-auth-session.service";

/** @returns Danh mục chủ phiên dùng cùng quyền đọc phiên, gồm trạng thái tải và thử lại. */
export function useAdminSessionUsers() {
  return useQuery({
    queryKey: authKeys.adminSessionUsers(),
    queryFn: ({ signal }) => adminAuthSessionService.listUsers(signal),
  });
}
