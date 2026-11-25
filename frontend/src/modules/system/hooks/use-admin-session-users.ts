"use client";

import { useQuery } from "@tanstack/react-query";

import { usePermission } from "./use-permission";
import { SESSION_PERMISSIONS } from "../permissions/session-permission";
import { authKeys } from "../constants/query-keys";
import { adminAuthSessionService } from "../services/admin-auth-session.service";

/** @returns Danh mục chủ phiên dùng cùng quyền đọc phiên, gồm trạng thái tải và thử lại. */
export function useAdminSessionUsers(enabled = true) {
  const canReadSessions = usePermission(SESSION_PERMISSIONS.sessionRead);
  return useQuery({
    queryKey: authKeys.adminSessionUsers(),
    queryFn: ({ signal }) => adminAuthSessionService.listUsers(signal),
    enabled: enabled && canReadSessions,
  });
}
