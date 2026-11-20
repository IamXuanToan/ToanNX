"use client";

import { useTranslations } from "next-intl";

import { useListQuery } from "@/shares/hooks/use-list-query";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { authKeys } from "../constants/query-keys";
import { adminAuthSessionService } from "../services/admin-auth-session.service";
import type { AdminSessionFilters } from "../types/admin-session.types";

const INVALIDATE = [authKeys.adminSessions(), authKeys.adminSessionUsers()];

/** @param filters - Bộ lọc đã áp dụng. @returns Truy vấn phiên của mọi người dùng. */
export function useAdminSessions(filters: AdminSessionFilters) {
  return useListQuery(authKeys.adminSessions(filters), (signal) =>
    adminAuthSessionService.list(filters, signal),
  );
}

/** @returns Mutation thu hồi phiên, thông báo kết quả và làm mới danh sách. */
export function useRevokeAdminSession() {
  const t = useTranslations("system.auth.sessions");
  return useResourceMutation({
    mutationFn: (id: string) => adminAuthSessionService.revoke(id),
    invalidate: INVALIDATE,
    success: () => t("revoked"),
  });
}

/** @returns Mutation thu hồi nhiều phiên, thông báo số phiên đã thu hồi và làm mới danh sách. */
export function useBulkRevokeAdminSessions() {
  const t = useTranslations("system.auth.sessions");
  return useResourceMutation({
    mutationFn: (ids: string[]) => adminAuthSessionService.bulkRevoke(ids),
    invalidate: INVALIDATE,
    success: (count) => t("bulkRevoked", { count }),
  });
}

/** @returns Mutation xóa mềm phiên và làm mới danh sách. */
export function useDeleteAdminSessions() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => adminAuthSessionService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
